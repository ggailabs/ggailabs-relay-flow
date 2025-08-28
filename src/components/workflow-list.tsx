"use client"

import { useState, useEffect } from "react"
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
  Zap,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Workflow {
  id: string
  name: string
  description?: string
  isActive: boolean
  trigger: string
  config: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    email: string
    name?: string
  }
  steps: any[]
  executions: any[]
}

interface WorkflowListProps {
  onWorkflowSelect: (id: string) => void
}

export function WorkflowList({ onWorkflowSelect }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/workflows')
      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }
      
      const data = await response.json()
      setWorkflows(data.workflows || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast({
        title: "Erro",
        description: "Falha ao carregar workflows",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to execute workflow')
      }
      
      const result = await response.json()
      toast({
        title: "Sucesso",
        description: `Workflow executado com sucesso. ID: ${result.executionId}`
      })
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao executar workflow",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
    } else {
      return <Badge variant="outline">Inativo</Badge>
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

  const calculateStats = () => {
    const totalWorkflows = workflows.length
    const activeWorkflows = workflows.filter(w => w.isActive).length
    const totalExecutions = workflows.reduce((sum, w) => sum + (w.executions?.length || 0), 0)
    
    const successRates = workflows.map(w => {
      if (!w.executions || w.executions.length === 0) return 0
      const successful = w.executions.filter((e: any) => e.status === 'SUCCESS').length
      return Math.round((successful / w.executions.length) * 100)
    })
    
    const avgSuccessRate = successRates.length > 0 
      ? Math.round(successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length)
      : 0

    return { totalWorkflows, activeWorkflows, totalExecutions, avgSuccessRate }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando workflows...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchWorkflows} className="mt-2">Tentar novamente</Button>
        </div>
      </div>
    )
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
                <p className="text-2xl font-bold">{stats.totalWorkflows}</p>
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
                <p className="text-2xl font-bold">{stats.activeWorkflows}</p>
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
                <p className="text-2xl font-bold">{stats.totalExecutions}</p>
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
                <p className="text-2xl font-bold">{stats.avgSuccessRate}%</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => {
          const successRate = workflow.executions && workflow.executions.length > 0
            ? Math.round((workflow.executions.filter((e: any) => e.status === 'SUCCESS').length / workflow.executions.length) * 100)
            : 0
          
          const lastExecution = workflow.executions && workflow.executions.length > 0
            ? workflow.executions[0]
            : null

          return (
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
                    {getStatusBadge(workflow.isActive)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          executeWorkflow(workflow.id)
                        }}>
                          Executar Agora
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Logs</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {workflow.description || "Sem descrição"}
                </CardDescription>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Última execução: {lastExecution 
                      ? new Date(lastExecution.startedAt).toLocaleString('pt-BR')
                      : "Nunca"
                    }
                  </span>
                  <span>{workflow.executions?.length || 0} execuções</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{successRate}%</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      executeWorkflow(workflow.id)
                    }}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Executar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum workflow encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro workflow para automatizar seus processos
          </p>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Workflow
          </Button>
        </div>
      )}
    </div>
  )
}