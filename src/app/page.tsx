"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Settings, Trash2, Edit, LogOut, User } from "lucide-react";
import { Flow, Node, Connection } from "@/types/flow";
import FlowEditor from "@/components/flow-editor";
import FlowCanvas from "@/components/flow-canvas";

interface FlowCardProps {
  flow: Flow;
  onEdit: (flow: Flow) => void;
  onDelete: (flowId: string) => void;
  onRun: (flow: Flow) => void;
}

function FlowCard({ flow, onEdit, onDelete, onRun }: FlowCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">{flow.name}</CardTitle>
            {flow.description && (
              <CardDescription className="text-xs sm:text-sm line-clamp-2">
                {flow.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={flow.isActive ? "default" : "secondary"} className="text-xs">
            {flow.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-4">
          <span>{flow.nodes.length} nodes</span>
          <span>{flow.connections.length} connections</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(flow)}
            className="flex-1"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="text-xs sm:text-sm">Edit</span>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRun(flow)}
              disabled={!flow.isActive}
              className="px-2 sm:px-3"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(flow.id)}
              className="px-2 sm:px-3 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (session) {
      fetchFlows();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchFlows = async () => {
    try {
      const response = await fetch("/api/flows");
      if (response.ok) {
        const data = await response.json();
        setFlows(data);
      }
    } catch (error) {
      console.error("Error fetching flows:", error);
    } finally {
      setLoading(false);
    }
  };

  const createFlow = async () => {
    const name = prompt("Enter flow name:");
    if (!name) return;

    const description = prompt("Enter flow description (optional):");

    try {
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const newFlow = await response.json();
        setFlows([newFlow, ...flows]);
      }
    } catch (error) {
      console.error("Error creating flow:", error);
    }
  };

  const deleteFlow = async (flowId: string) => {
    if (!confirm("Are you sure you want to delete this flow?")) return;

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFlows(flows.filter(flow => flow.id !== flowId));
        if (selectedFlow?.id === flowId) {
          setSelectedFlow(null);
        }
      }
    } catch (error) {
      console.error("Error deleting flow:", error);
    }
  };

  const runFlow = async (flow: Flow) => {
    try {
      const response = await fetch(`/api/flows/${flow.id}/execute`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Flow "${flow.name}" executed successfully!\n\nExecuted nodes: ${result.executedNodes.length}\nExecution log: ${result.executionLog.length} entries`);
      } else {
        const error = await response.json();
        alert(`Failed to execute flow: ${error.error}`);
      }
    } catch (error) {
      console.error("Error running flow:", error);
      alert("Failed to execute flow. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Relay Flows</CardTitle>
            <CardDescription>
              Sign in to create and manage your relay workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => signIn()} 
              className="w-full"
              size="lg"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showEditor && selectedFlow) {
    return (
      <FlowEditor
        flow={selectedFlow}
        onBack={() => {
          setShowEditor(false);
          setSelectedFlow(null);
          fetchFlows();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relay Flows</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back, {session.user?.name}! Create and manage your relay workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={createFlow} className="gap-2">
              <Plus className="w-4 h-4" />
              New Flow
            </Button>
            <Button variant="outline" onClick={() => signOut()} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No flows yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Create your first relay flow to get started
            </p>
            <Button onClick={createFlow}>Create Flow</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {flows.map((flow) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                onEdit={(flow) => {
                  setSelectedFlow(flow);
                  setShowEditor(true);
                }}
                onDelete={deleteFlow}
                onRun={runFlow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}