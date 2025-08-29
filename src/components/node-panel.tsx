"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Flow } from "@/types/flow";

interface NodePanelProps {
  flow: Flow;
  onFlowUpdate: (flow: Flow) => void;
  onClose: () => void;
}

const nodeTypes = [
  {
    type: "trigger",
    title: "Trigger",
    description: "Start the flow with an event",
    icon: "🚀",
    color: "border-green-500 bg-green-50 dark:bg-green-950",
  },
  {
    type: "action",
    title: "Action",
    description: "Perform an action or operation",
    icon: "⚡",
    color: "border-blue-500 bg-blue-50 dark:bg-blue-950",
  },
  {
    type: "condition",
    title: "Condition",
    description: "Branch flow based on conditions",
    icon: "🔀",
    color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
  },
  {
    type: "delay",
    title: "Delay",
    description: "Wait for a specified time",
    icon: "⏰",
    color: "border-orange-500 bg-orange-50 dark:bg-orange-950",
  },
  {
    type: "webhook",
    title: "Webhook",
    description: "Send or receive web requests",
    icon: "🌐",
    color: "border-purple-500 bg-purple-50 dark:bg-purple-950",
  },
  {
    type: "transform",
    title: "Transform",
    description: "Transform or modify data",
    icon: "🔄",
    color: "border-indigo-500 bg-indigo-50 dark:bg-indigo-950",
  },
  {
    type: "filter",
    title: "Filter",
    description: "Filter data based on criteria",
    icon: "🔍",
    color: "border-pink-500 bg-pink-50 dark:bg-pink-950",
  },
];

export default function NodePanel({ flow, onFlowUpdate, onClose }: NodePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const filteredNodeTypes = nodeTypes.filter(nodeType =>
    nodeType.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nodeType.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNode = async (nodeType: string) => {
    const nodeConfig = nodeTypes.find(nt => nt.type === nodeType);
    if (!nodeConfig) return;

    try {
      const response = await fetch("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowId: flow.id,
          type: nodeType,
          title: nodeConfig.title,
          positionX: 100,
          positionY: 100,
          config: {},
        }),
      });

      if (response.ok) {
        const newNode = await response.json();
        const updatedFlow = {
          ...flow,
          nodes: [...flow.nodes, newNode],
        };
        onFlowUpdate(updatedFlow);
        onClose();
      }
    } catch (error) {
      console.error("Error adding node:", error);
    }
  };

  return (
    <div className="w-full sm:w-80 h-full bg-background border-l shadow-lg flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Node</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Input
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNodeTypes.map((nodeType) => (
          <Card
            key={nodeType.type}
            className={`cursor-pointer hover:shadow-md transition-all ${nodeType.color} ${
              selectedNode === nodeType.type ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setSelectedNode(nodeType.type)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{nodeType.icon}</span>
                <CardTitle className="text-sm font-medium">
                  {nodeType.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs ml-auto">
                  {nodeType.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">
                {nodeType.description}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  addNode(nodeType.type);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Flow
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNodeTypes.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
          <p className="text-sm text-center">No nodes found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}