"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Search,
  Filter,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useWebSocket } from "@/hooks/use-websocket"
import { useToast } from "@/hooks/use-toast"

interface ExecutionLog {
  id: string
  level: "DEBUG" | "INFO" | "WARN" | "ERROR"
  message: string
  timestamp: string
  stepName?: string
}

interface Execution {
  id: string
  workflowName: string
  workflowId: string
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED"
  startedAt: string
  completedAt?: string
  duration?: string
  triggerData?: string
  logs: ExecutionLog[]
}

export function ExecutionHistory() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const { isConnected, connectionError, subscribeToWorkflow, unsubscribeFromWorkflow } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'execution:update':
          handleExecutionUpdate(message.data)
          break
        case 'execution:log':
          handleExecutionLog(message.data)
          break
        case 'execution:started':
          handleExecutionStarted(message.data)
          break
        case 'execution:completed':
          handleExecutionCompleted(message.data)
          break
      }
    }
  })

  // Fetch executions from API
  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/executions')
      if (!response.ok) {
        throw new Error('Failed to fetch executions')
      }
      
      const data = await response.json()
      const formattedExecutions = data.executions.map((execution: any) => ({
        id: execution.id,
        workflowName: execution.workflow.name,
        workflowId: execution.workflow.id,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        duration: execution.completedAt 
          ? `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s`
          : undefined,
        triggerData: execution.triggerData,
        logs: (execution.logs || []).map((log: any) => ({
          id: log.id,
          level: log.level,
          message: log.message,
          timestamp: log.createdAt,
          stepName: log.stepId ? `Step ${log.stepId}` : undefined
        }))
      }))
      
      setExecutions(formattedExecutions)
      if (formattedExecutions.length > 0 && !selectedExecution) {
        setSelectedExecution(formattedExecutions[0])
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar execuções",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchExecutions()
  }, [])

  // Subscribe to all workflow updates
  useEffect(() => {
    const workflowIds = Array.from(new Set(executions.map(e => e.workflowId)))
    workflowIds.forEach(id => subscribeToWorkflow(id))

    return () => {
      workflowIds.forEach(id => unsubscribeFromWorkflow(id))
    }
  }, [executions, subscribeToWorkflow, unsubscribeFromWorkflow])

  const handleExecutionUpdate = (update: any) => {
    setExecutions(prev => prev.map(execution => {
      if (execution.id === update.executionId) {
        return {
          ...execution,
          status: update.status
        }
      }
      return execution
    }))

    if (selectedExecution?.id === update.executionId) {
      setSelectedExecution(prev => prev ? { ...prev, status: update.status } : null)
    }
  }

  const handleExecutionLog = (log: any) => {
    if (selectedExecution?.id === log.executionId) {
      setSelectedExecution(prev => {
        if (!prev) return null
        
        const newLog: ExecutionLog = {
          id: Date.now().toString(),
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
          stepName: log.stepId ? `Step ${log.stepId}` : undefined
        }

        return {
          ...prev,
          logs: [...prev.logs, newLog]
        }
      })
    }
  }

  const handleExecutionStarted = (data: any) => {
    const newExecution: Execution = {
      id: data.executionId,
      workflowName: "Novo Workflow", // This would be fetched from API
      workflowId: data.workflowId,
      status: "RUNNING",
      startedAt: data.timestamp,
      logs: [
        {
          id: "1",
          level: "INFO",
          message: "Execução do workflow iniciada",
          timestamp: data.timestamp
        }
      ]
    }

    setExecutions(prev => [newExecution, ...prev])
  }

  const handleExecutionCompleted = (data: any) => {
    setExecutions(prev => prev.map(execution => {
      if (execution.id === data.executionId) {
        return {
          ...execution,
          status: data.status,
          completedAt: data.timestamp,
          duration: data.timestamp 
            ? `${Math.round((new Date(data.timestamp).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s`
            : execution.duration
        }
      }
      return execution
    }))

    if (selectedExecution?.id === data.executionId) {
      setSelectedExecution(prev => prev ? { 
        ...prev, 
        status: data.status,
        completedAt: data.timestamp,
        duration: data.timestamp 
          ? `${Math.round((new Date(data.timestamp).getTime() - new Date(prev.startedAt).getTime()) / 1000)}s`
          : prev.duration
      } : null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-500 hover:bg-green-600">Sucesso</Badge>
      case "FAILED":
        return <Badge variant="destructive">Falhou</Badge>
      case "RUNNING":
        return <Badge className="bg-blue-500 hover:bg-blue-600 animate-pulse">Executando</Badge>
      case "PENDING":
        return <Badge variant="secondary">Pendente</Badge>
      case "CANCELLED":
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "RUNNING":
        return <Play className="w-4 h-4 text-blue-500" />
      case "PENDING":
        return <Clock className="w-4 h-4 text-gray-500" />
      case "CANCELLED":
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-500"
      case "WARN":
        return "text-orange-500"
      case "INFO":
        return "text-blue-500"
      case "DEBUG":
        return "text-gray-500"
      default:
        return "text-gray-500"
    }
  }

  const filteredExecutions = executions.filter(execution =>
    execution.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    execution.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando execuções...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Histórico de Execuções</h1>
            <p className="text-muted-foreground">
              Monitore e depure execuções de workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Ao Vivo</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Offline</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setRefreshing(true)
              fetchExecutions()
            }}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Execuções</p>
                <p className="text-2xl font-bold">{executions.length}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bem Sucedidas</p>
                <p className="text-2xl font-bold">
                  {executions.filter(e => e.status === "SUCCESS").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold">
                  {executions.filter(e => e.status === "FAILED").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Executando</p>
                <p className="text-2xl font-bold">
                  {executions.filter(e => e.status === "RUNNING").length}
                </p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Execuções Recentes</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Pesquisar execuções..."
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedExecution?.id === execution.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedExecution(execution)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span className="font-medium">{execution.workflowName}</span>
                    </div>
                    {getStatusBadge(execution.status)}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(execution.startedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {execution.duration || "Executando..."}
                      </span>
                    </div>
                    <span className="text-xs">ID: {execution.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Execution Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Execução</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedExecution ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Workflow</label>
                    <p className="font-medium">{selectedExecution.workflowName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedExecution.status)}
                      {getStatusBadge(selectedExecution.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Iniciado</label>
                    <p className="font-medium">
                      {new Date(selectedExecution.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duração</label>
                    <p className="font-medium">{selectedExecution.duration || "Executando..."}</p>
                  </div>
                </div>

                {/* Trigger Data */}
                {selectedExecution.triggerData && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Dados do Gatilho
                    </label>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedExecution.triggerData), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Execution Logs */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Logs da Execução
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedExecution.logs.map((log) => (
                      <div key={log.id} className="text-sm p-3 bg-muted rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${getLogLevelColor(log.level)}`}>
                            {log.level}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{log.message}</p>
                        {log.stepName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Step: {log.stepName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p>Selecione uma execução para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}