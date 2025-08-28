"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Workflow, 
  History, 
  Plus,
  Settings,
  HelpCircle
} from "lucide-react"
import type { View } from "@/app/page"

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  selectedWorkflowId: string | null
  onWorkflowSelect: (id: string) => void
}

export function Sidebar({ 
  currentView, 
  onViewChange, 
  selectedWorkflowId,
  onWorkflowSelect 
}: SidebarProps) {
  const menuItems = [
    { id: "workflows" as View, label: "Workflows", icon: LayoutDashboard },
    { id: "history" as View, label: "Histórico de Execuções", icon: History },
    { id: "webhooks" as View, label: "Webhooks", icon: Workflow },
  ]

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Workflow className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Flow Relay</h1>
            <p className="text-xs text-muted-foreground">Automação de Workflows</p>
          </div>
        </div>
      </div>

      {/* New Workflow Button */}
      <div className="p-4">
        <Button 
          className="w-full justify-start gap-2" 
          onClick={() => {
            // This will be handled by the WorkflowList component
            onViewChange("workflows")
          }}
        >
          <Plus className="w-4 h-4" />
          Novo Workflow
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      {/* Recent Workflows */}
      <div className="p-4 border-t border-border">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">
          Workflows Recentes
        </h3>
        <div className="space-y-1">
          {/* Sample recent workflows - these will be fetched from API */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={() => onWorkflowSelect("1")}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="truncate">Sincronização de API</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Ativo
              </Badge>
            </div>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={() => onWorkflowSelect("2")}
          >
            <div className="flex items-center gap-2 w-full">
              <span className="truncate">Notificações por Email</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Rascunho
              </Badge>
            </div>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <Settings className="w-4 h-4" />
          Configurações
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <HelpCircle className="w-4 h-4" />
          Ajuda e Suporte
        </Button>
      </div>
    </div>
  )
}