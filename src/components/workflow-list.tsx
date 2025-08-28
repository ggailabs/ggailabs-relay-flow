"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Play, 
  Pause, 
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface WorkflowListProps {
  onWorkflowSelect: (id: string) => void
}

// Mock data - in a real app, this would come from an API
const mockWorkflows = [
  {
    id: "1",
    name: "Sincronização de API",
    description: "Sincroniza dados entre API externa e banco de dados local",
    status: "active",
    trigger: "http",
    lastRun: "2 minutos atrás",
    executions: 142,
    successRate: 98
  },
  {
    id: "2", 
    name: "Notificações por Email",
    description: "Envia emails automáticos para novos cadastros de usuários",
    status: "draft",
    trigger: "webhook",
    lastRun: "Nunca",
    executions: 0,
    successRate: 0
  },
  {
    id: "3",
    name: "Gerador de Relatórios Diários",
    description: "Gera e envia relatórios de analytics por email",
    status: "active",
    trigger: "schedule",
    lastRun: "1 hora atrás",
    executions: 30,
    successRate: 100
  },
  {
    id: "4",
    name: "Pipeline de Processamento de Dados",
    description: "Processa e transforma dados CSV de uploads",
    status: "inactive",
    trigger: "manual",
    lastRun: "3 dias atrás",
    executions: 15,
    successRate: 87
  }
]

export function WorkflowList({ onWorkflowSelect }: WorkflowListProps) {
  const [workflows] = useState(mockWorkflows)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
      case "draft":
        return <Badge variant="secondary">Rascunho</Badge>
      case "inactive":
        return <Badge variant="outline">Inativo</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case "http":
        return <Zap className="w-4 h-4" />
      case "webhook":
        return <Zap className="w-4 h-4" />
      case "schedule":
        return <Clock className="w-4 h-4" />
      case "manual":
        return <Play className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Gerencie e automatize seus processos de negócio
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Criar Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{workflows.filter(w => w.status === "active").length}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Execuções</p>
                <p className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.executions, 0)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)}%
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card 
            key={workflow.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onWorkflowSelect(workflow.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getTriggerIcon(workflow.trigger)}
                    <span className="text-sm text-muted-foreground capitalize">
                      {workflow.trigger}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(workflow.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Duplicar</DropdownMenuItem>
                      <DropdownMenuItem>Executar Agora</DropdownMenuItem>
                      <DropdownMenuItem>Ver Logs</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {workflow.description}
              </CardDescription>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Última execução: {workflow.lastRun}</span>
                <span>{workflow.executions} execuções</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${workflow.successRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{workflow.successRate}%</span>
                </div>
                
                <Button variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  Executar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}