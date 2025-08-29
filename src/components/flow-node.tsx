"use client";

import { useDrag } from "react-dnd";
import { Node } from "@/types/flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Link, Play, Settings, Trash2 } from "lucide-react";

interface FlowNodeProps {
  node: Node;
  isConnecting?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onConnect: (e: React.MouseEvent) => void;
  onDelete: (nodeId: string) => void;
  onEdit: (node: Node) => void;
}

const getNodeColor = (type: Node["type"]) => {
  switch (type) {
    case "trigger":
      return "border-green-500 bg-green-50 dark:bg-green-950";
    case "action":
      return "border-blue-500 bg-blue-50 dark:bg-blue-950";
    case "condition":
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
    case "delay":
      return "border-orange-500 bg-orange-50 dark:bg-orange-950";
    case "webhook":
      return "border-purple-500 bg-purple-50 dark:bg-purple-950";
    case "transform":
      return "border-indigo-500 bg-indigo-50 dark:bg-indigo-950";
    case "filter":
      return "border-pink-500 bg-pink-50 dark:bg-pink-950";
    default:
      return "border-gray-500 bg-gray-50 dark:bg-gray-950";
  }
};

const getNodeIcon = (type: Node["type"]) => {
  switch (type) {
    case "trigger":
      return "🚀";
    case "action":
      return "⚡";
    case "condition":
      return "🔀";
    case "delay":
      return "⏰";
    case "webhook":
      return "🌐";
    case "transform":
      return "🔄";
    case "filter":
      return "🔍";
    default:
      return "📦";
  }
};

export default function FlowNode({ node, isConnecting, onClick, onConnect, onDelete, onEdit }: FlowNodeProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "node",
    item: { id: node.id, type: "node", x: node.positionX, y: node.positionY },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`absolute cursor-move transition-all ${isDragging ? "opacity-50" : ""}`}
      style={{
        left: node.positionX,
        top: node.positionY,
        transform: isConnecting ? "scale(1.05)" : "none",
        zIndex: isConnecting ? 10 : 1,
      }}
      onClick={onClick}
    >
      <Card
        className={`w-40 sm:w-48 shadow-lg hover:shadow-xl transition-all ${getNodeColor(node.type)} ${
          isConnecting ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base sm:text-lg">{getNodeIcon(node.type)}</span>
              <CardTitle className="text-xs sm:text-sm font-medium truncate">
                {node.title}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {node.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {node.sourceConnections.length} output{node.sourceConnections.length !== 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 sm:px-2 text-xs"
                onClick={onConnect}
              >
                <Link className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Connect</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 sm:px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node);
                }}
              >
                <Settings className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Config</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 sm:px-2 text-xs"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const response = await fetch(`/api/nodes/${node.id}/test`, {
                      method: "POST",
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      alert(`Node "${node.title}" test ${result.success ? "successful" : "failed"}!\n\n${result.message}\n\nData: ${JSON.stringify(result.data, null, 2)}`);
                    } else {
                      const error = await response.json();
                      alert(`Failed to test node: ${error.error}`);
                    }
                  } catch (error) {
                    console.error("Error testing node:", error);
                    alert("Failed to test node. Please try again.");
                  }
                }}
              >
                <Play className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Test</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1 sm:px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete node "${node.title}"?`)) {
                    onDelete(node.id);
                  }
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Connection points */}
      <div
        className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-crosshair hover:bg-blue-600 transition-colors"
        onClick={onConnect}
        title="Connect to another node"
      />
    </div>
  );
}