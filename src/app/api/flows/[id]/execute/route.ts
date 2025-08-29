import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth/config";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if flow exists and user owns it
    const flow = await db.flow.findUnique({
      where: { id: params.id },
      include: {
        author: true,
        nodes: {
          include: {
            sourceConnections: true,
            targetConnections: true,
          },
        },
        connections: {
          include: {
            sourceNode: true,
            targetNode: true,
          },
        },
      },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    if (flow.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!flow.isActive) {
      return NextResponse.json({ error: "Flow is not active" }, { status: 400 });
    }

    // Find trigger nodes (nodes with no incoming connections)
    const triggerNodes = flow.nodes.filter(node => 
      node.targetConnections.length === 0
    );

    if (triggerNodes.length === 0) {
      return NextResponse.json({ 
        error: "No trigger nodes found in flow" 
      }, { status: 400 });
    }

    // Simulate flow execution
    const executionLog = [];
    const executedNodes = new Set();

    // Execute each trigger node
    for (const triggerNode of triggerNodes) {
      await executeNode(triggerNode, flow, executionLog, executedNodes);
    }

    return NextResponse.json({
      message: "Flow executed successfully",
      executionLog,
      executedNodes: Array.from(executedNodes),
    });

  } catch (error) {
    console.error("Error executing flow:", error);
    return NextResponse.json(
      { error: "Failed to execute flow" },
      { status: 500 }
    );
  }
}

async function executeNode(
  node: any,
  flow: any,
  executionLog: any[],
  executedNodes: Set<string>
) {
  if (executedNodes.has(node.id)) {
    return;
  }

  executedNodes.add(node.id);

  // Simulate node execution based on type
  let executionResult = { success: true, message: "" };

  switch (node.type) {
    case "trigger":
      executionResult = {
        success: true,
        message: `Trigger "${node.title}" activated`,
      };
      break;
    
    case "action":
      executionResult = {
        success: true,
        message: `Action "${node.title}" executed`,
      };
      break;
    
    case "condition":
      executionResult = {
        success: Math.random() > 0.3, // 70% success rate
        message: `Condition "${node.title}" evaluated`,
      };
      break;
    
    case "delay":
      executionResult = {
        success: true,
        message: `Delay "${node.title}" completed`,
      };
      break;
    
    case "webhook":
      executionResult = {
        success: Math.random() > 0.2, // 80% success rate
        message: `Webhook "${node.title}" processed`,
      };
      break;
    
    case "transform":
      executionResult = {
        success: true,
        message: `Transform "${node.title}" applied`,
      };
      break;
    
    case "filter":
      executionResult = {
        success: Math.random() > 0.4, // 60% success rate
        message: `Filter "${node.title}" processed`,
      };
      break;
    
    default:
      executionResult = {
        success: false,
        message: `Unknown node type: ${node.type}`,
      };
  }

  executionLog.push({
    nodeId: node.id,
    nodeTitle: node.title,
    nodeType: node.type,
    ...executionResult,
    timestamp: new Date().toISOString(),
  });

  // If execution failed, stop this branch
  if (!executionResult.success) {
    return;
  }

  // Find outgoing connections and execute connected nodes
  const outgoingConnections = flow.connections.filter(
    conn => conn.sourceId === node.id
  );

  for (const connection of outgoingConnections) {
    const targetNode = flow.nodes.find(n => n.id === connection.targetId);
    if (targetNode) {
      // Add a small delay to simulate async execution
      await new Promise(resolve => setTimeout(resolve, 100));
      await executeNode(targetNode, flow, executionLog, executedNodes);
    }
  }
}