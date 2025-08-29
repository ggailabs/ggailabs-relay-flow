"use client";

import { useState, useCallback, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Flow, Node, Connection } from "@/types/flow";
import FlowNode from "@/components/flow-node";
import ConnectionLine from "@/components/connection-line";
import { Plus } from "lucide-react";

interface FlowCanvasProps {
  flow: Flow;
  onFlowUpdate: (flow: Flow) => void;
  onAddNode: () => void;
}

interface DraggedNode {
  type: string;
  title: string;
  x: number;
  y: number;
}

interface CanvasItem {
  id: string;
  type: string;
  x: number;
  y: number;
}

const Canvas = ({ flow, onFlowUpdate, onAddNode }: FlowCanvasProps) => {
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectingNode, setConnectingNode] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{ fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const moveNode = useCallback(async (nodeId: string, x: number, y: number) => {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionX: x, positionY: y }),
      });

      if (response.ok) {
        const updatedNode = await response.json();
        const updatedFlow = {
          ...flow,
          nodes: flow.nodes.map(node =>
            node.id === nodeId ? updatedNode : node
          ),
        };
        onFlowUpdate(updatedFlow);
      }
    } catch (error) {
      console.error("Error moving node:", error);
    }
  }, [flow, onFlowUpdate]);

  const deleteNode = useCallback(async (nodeId: string) => {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Also delete connections associated with this node
        const connectionsToDelete = flow.connections.filter(
          conn => conn.sourceId === nodeId || conn.targetId === nodeId
        );
        
        for (const connection of connectionsToDelete) {
          await fetch(`/api/connections/${connection.id}`, {
            method: "DELETE",
          });
        }

        const updatedFlow = {
          ...flow,
          nodes: flow.nodes.filter(node => node.id !== nodeId),
          connections: flow.connections.filter(
            conn => conn.sourceId !== nodeId && conn.targetId !== nodeId
          ),
        };
        onFlowUpdate(updatedFlow);
      }
    } catch (error) {
      console.error("Error deleting node:", error);
    }
  }, [flow, onFlowUpdate]);

  const editNode = useCallback((node: Node) => {
    const newTitle = prompt("Enter new title:", node.title);
    if (newTitle && newTitle !== node.title) {
      updateNode(node.id, { title: newTitle });
    }
  }, []);

  const updateNode = useCallback(async (nodeId: string, updates: Partial<Node>) => {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedNode = await response.json();
        const updatedFlow = {
          ...flow,
          nodes: flow.nodes.map(node =>
            node.id === nodeId ? updatedNode : node
          ),
        };
        onFlowUpdate(updatedFlow);
      }
    } catch (error) {
      console.error("Error updating node:", error);
    }
  }, [flow, onFlowUpdate]);

  const createConnection = useCallback(async (sourceId: string, targetId: string) => {
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId: flow.id,
          sourceId,
          targetId,
        }),
      });

      if (response.ok) {
        const newConnection = await response.json();
        const updatedFlow = {
          ...flow,
          connections: [...flow.connections, newConnection],
        };
        onFlowUpdate(updatedFlow);
      }
    } catch (error) {
      console.error("Error creating connection:", error);
    }
  }, [flow, onFlowUpdate]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedFlow = {
          ...flow,
          connections: flow.connections.filter(conn => conn.id !== connectionId),
        };
        onFlowUpdate(updatedFlow);
      }
    } catch (error) {
      console.error("Error deleting connection:", error);
    }
  }, [flow, onFlowUpdate]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (connectingNode) {
      setConnectingNode(null);
      setTempConnection(null);
    }
  }, [connectingNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (connectingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const sourceNode = flow.nodes.find(node => node.id === connectingNode);
      if (sourceNode) {
        setTempConnection({
          fromX: sourceNode.positionX + 100,
          fromY: sourceNode.positionY + 40,
          toX: x,
          toY: y,
        });
      }
    }
  }, [connectingNode, flow.nodes]);

  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (connectingNode && connectingNode !== nodeId) {
      createConnection(connectingNode, nodeId);
      setConnectingNode(null);
      setTempConnection(null);
    }
  }, [connectingNode, createConnection]);

  const handleNodeConnect = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingNode(nodeId);
  }, []);

  const [, drop] = useDrop(() => ({
    accept: "node",
    drop: (item: CanvasItem, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        const x = Math.round(item.x + delta.x);
        const y = Math.round(item.y + delta.y);
        moveNode(item.id, x, y);
      }
      return undefined;
    },
  }));

  return (
    <div
      ref={(node) => {
        drop(node);
        if (node) canvasRef.current = node;
      }}
      className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden"
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {flow.connections.map((connection) => {
          const sourceNode = flow.nodes.find(n => n.id === connection.sourceId);
          const targetNode = flow.nodes.find(n => n.id === connection.targetId);
          
          if (!sourceNode || !targetNode) return null;
          
          return (
            <ConnectionLine
              key={connection.id}
              sourceX={sourceNode.positionX + 100}
              sourceY={sourceNode.positionY + 40}
              targetX={targetNode.positionX}
              targetY={targetNode.positionY + 40}
              connection={connection}
              onDelete={deleteConnection}
            />
          );
        })}
        
        {/* Temporary connection line */}
        {tempConnection && (
          <ConnectionLine
            sourceX={tempConnection.fromX}
            sourceY={tempConnection.fromY}
            targetX={tempConnection.toX}
            targetY={tempConnection.toY}
            isTemporary
          />
        )}
      </svg>

      {/* Nodes */}
      {flow.nodes.map((node) => (
        <FlowNode
          key={node.id}
          node={node}
          isConnecting={connectingNode === node.id}
          onClick={(e) => handleNodeClick(node.id, e)}
          onConnect={(e) => handleNodeConnect(node.id, e)}
          onDelete={deleteNode}
          onEdit={editNode}
        />
      ))}

      {/* Add Node Button */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={onAddNode}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Connection mode indicator */}
      {connectingNode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Click on a target node to create connection
        </div>
      )}
    </div>
  );
};

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <Canvas {...props} />
    </DndProvider>
  );
}