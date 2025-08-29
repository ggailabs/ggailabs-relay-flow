"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Play, Settings, Plus } from "lucide-react";
import { Flow, Node, Connection } from "@/types/flow";
import FlowCanvas from "@/components/flow-canvas";
import NodePanel from "@/components/node-panel";

interface FlowEditorProps {
  flow: Flow;
  onBack: () => void;
}

export default function FlowEditor({ flow, onBack }: FlowEditorProps) {
  const [currentFlow, setCurrentFlow] = useState<Flow>(flow);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(flow.name);
  const [editedDescription, setEditedDescription] = useState(flow.description || "");
  const [showNodePanel, setShowNodePanel] = useState(false);

  useEffect(() => {
    setCurrentFlow(flow);
    setEditedName(flow.name);
    setEditedDescription(flow.description || "");
  }, [flow]);

  const saveFlow = async () => {
    try {
      const response = await fetch(`/api/flows/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
        }),
      });

      if (response.ok) {
        const updatedFlow = await response.json();
        setCurrentFlow(updatedFlow);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving flow:", error);
    }
  };

  const toggleFlowStatus = async () => {
    try {
      const response = await fetch(`/api/flows/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !currentFlow.isActive,
        }),
      });

      if (response.ok) {
        const updatedFlow = await response.json();
        setCurrentFlow(updatedFlow);
      }
    } catch (error) {
      console.error("Error toggling flow status:", error);
    }
  };

  const runFlow = async () => {
    try {
      const response = await fetch(`/api/flows/${currentFlow.id}/execute`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Flow "${currentFlow.name}" executed successfully!\n\nExecuted nodes: ${result.executedNodes.length}\nExecution log: ${result.executionLog.length} entries`);
      } else {
        const error = await response.json();
        alert(`Failed to execute flow: ${error.error}`);
      }
    } catch (error) {
      console.error("Error running flow:", error);
      alert("Failed to execute flow. Please try again.");
    }
  };

  const handleFlowUpdate = (updatedFlow: Flow) => {
    setCurrentFlow(updatedFlow);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="space-y-1 flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full sm:w-64"
                      placeholder="Flow name"
                    />
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Flow description"
                      className="w-full sm:w-96"
                      rows={2}
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{currentFlow.name}</h1>
                    {currentFlow.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                        {currentFlow.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Badge variant={currentFlow.isActive ? "default" : "secondary"} className="text-xs">
                {currentFlow.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveFlow}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleFlowStatus}
                  >
                    {currentFlow.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button onClick={runFlow} disabled={!currentFlow.isActive}>
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)] sm:h-[calc(100vh-73px)]">
        <div className="flex-1 relative">
          <FlowCanvas
            flow={currentFlow}
            onFlowUpdate={handleFlowUpdate}
            onAddNode={() => setShowNodePanel(true)}
          />
        </div>

        {showNodePanel && (
          <NodePanel
            flow={currentFlow}
            onFlowUpdate={handleFlowUpdate}
            onClose={() => setShowNodePanel(false)}
          />
        )}
      </div>
    </div>
  );
}