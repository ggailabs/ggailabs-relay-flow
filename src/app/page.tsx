"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { WorkflowList } from "@/components/workflow-list"
import { WorkflowBuilder } from "@/components/workflow-builder"
import { ExecutionHistory } from "@/components/execution-history"
import { WebhookManagement } from "@/components/webhook-management"
import { useAuth } from "@/components/auth/auth-provider"

type View = "workflows" | "builder" | "history" | "webhooks"

function Dashboard() {
  const [currentView, setCurrentView] = useState<View>("workflows")
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        selectedWorkflowId={selectedWorkflowId}
        onWorkflowSelect={setSelectedWorkflowId}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto p-6">
          {currentView === "workflows" && (
            <WorkflowList 
              onWorkflowSelect={(id) => {
                setSelectedWorkflowId(id)
                setCurrentView("builder")
              }} 
            />
          )}
          
          {currentView === "builder" && selectedWorkflowId && (
            <WorkflowBuilder 
              workflowId={selectedWorkflowId}
              onBack={() => setCurrentView("workflows")}
            />
          )}
          
          {currentView === "history" && (
            <ExecutionHistory />
          )}
          
          {currentView === "webhooks" && (
            <WebhookManagement />
          )}
        </main>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}