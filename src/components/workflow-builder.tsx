"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Plus,
  GripVertical,
  Settings,
  Trash2,
  Zap,
  Clock,
  MessageSquare,
  Database,
  FileText,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface WorkflowBuilderProps {
  workflowId: string
  onBack: () => void
}

interface WorkflowStep {
  id: string
  name: string
  type: string
  config: any
  order: number
}

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
  steps: WorkflowStep[]
  executions: any[]
}

const stepTypes = [
  { 
    id: "http_request", 
    name: "Requisição HTTP", 
    icon: Zap, 
    description: "Faz requisições HTTP para APIs externas",
    color: "bg-blue-500"
  },
  { 
    id: "email", 
    name: "Enviar Email", 
    icon: MessageSquare, 
    description: "Envia notificações por email",
    color: "bg-green-500"
  },
  { 
    id: "database", 
    name: "Operação de Banco", 
    icon: Database, 
    description: "Consulta ou atualiza banco de dados",
    color: "bg-purple-500"
  },
  { 
    id: "transform", 
    name: "Transformar Dados", 
    icon: FileText, 
    description: "Transforma e processa dados",
    color: "bg-orange-500"
  },
  { 
    id: "delay", 
    name: "Atraso", 
    icon: Clock, 
    description: "Adiciona atraso entre steps",
    color: "bg-gray-500"
  },
  { 
    id: "condition", 
    name: "Condição", 
    icon: FileText, 
    description: "Executa lógica condicional (if/else)",
    color: "bg-yellow-500"
  },
  { 
    id: "loop", 
    name: "Loop", 
    icon: FileText, 
    description: "Executa steps em loop",
    color: "bg-indigo-500"
  },
  { 
    id: "parallel", 
    name: "Paralelo", 
    icon: FileText, 
    description: "Executa múltiplos steps em paralelo",
    color: "bg-pink-500"
  },
  { 
    id: "webhook", 
    name: "Webhook", 
    icon: Zap, 
    description: "Envia dados para webhook externo",
    color: "bg-teal-500"
  },
  { 
    id: "variable", 
    name: "Variável", 
    icon: FileText, 
    description: "Define e manipula variáveis",
    color: "bg-cyan-500"
  }
]

export function WorkflowBuilder({ workflowId, onBack }: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [executing, setExecuting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchWorkflow()
  }, [workflowId])

  const fetchWorkflow = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workflows/${workflowId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch workflow')
      }
      
      const data = await response.json()
      setWorkflow(data)
      setSteps(data.steps || [])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar workflow",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveWorkflow = async () => {
    if (!workflow) return

    try {
      setSaving(true)
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          trigger: workflow.trigger,
          config: workflow.config,
          isActive: workflow.isActive
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save workflow')
      }

      toast({
        title: "Sucesso",
        description: "Workflow salvo com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar workflow",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const executeWorkflow = async () => {
    try {
      setExecuting(true)
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
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao executar workflow",
        variant: "destructive"
      })
    } finally {
      setExecuting(false)
    }
  }

  const addStep = (type: string) => {
    const stepType = stepTypes.find(st => st.id === type)
    if (!stepType) return

    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      name: stepType.name,
      type: stepType.id,
      config: {},
      order: steps.length + 1
    }

    setSteps([...steps, newStep])
  }

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId))
    if (selectedStep === stepId) {
      setSelectedStep(null)
    }
  }

  const getStepIcon = (type: string) => {
    const stepType = stepTypes.find(st => st.id === type)
    if (!stepType) return Zap
    
    const Icon = stepType.icon
    return <Icon className="w-5 h-5" />
  }

  const getStepColor = (type: string) => {
    const stepType = stepTypes.find(st => st.id === type)
    return stepType?.color || "bg-gray-500"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando workflow...</span>
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">Workflow não encontrado</p>
          <Button onClick={onBack} className="mt-2">Voltar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
            <p className="text-muted-foreground">{workflow.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={workflow.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
            {workflow.isActive ? "Ativo" : "Inativo"}
          </Badge>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={saveWorkflow}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </Button>
          <Button 
            className="gap-2"
            onClick={executeWorkflow}
            disabled={executing || !workflow.isActive}
          >
            {executing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Executar Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Steps do Workflow</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Step
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {stepTypes.map((stepType) => {
                      const Icon = stepType.icon
                      return (
                        <DropdownMenuItem 
                          key={stepType.id}
                          onClick={() => addStep(stepType.id)}
                          className="gap-2"
                        >
                          <div className={`w-8 h-8 rounded ${stepType.color} flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{stepType.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {stepType.description}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Trigger Step */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Gatilho</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {workflow.trigger === "http" ? "HTTP" : workflow.trigger === "webhook" ? "Webhook" : workflow.trigger === "schedule" ? "Agendado" : "Manual"}
                    </p>
                  </div>
                </div>

                {/* Connection Line */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-8 bg-border"></div>
                </div>

                {/* Workflow Steps */}
                {steps.map((step, index) => (
                  <div key={step.id} className="space-y-4">
                    <div 
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedStep === step.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedStep(step.id)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStepColor(step.type)}`}>
                        {getStepIcon(step.type)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">{step.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {step.type.replace('_', ' ')}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeStep(step.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="flex justify-center">
                        <div className="w-0.5 h-8 bg-border"></div>
                      </div>
                    )}
                  </div>
                ))}

                {steps.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhum step adicionado ainda. Clique em "Adicionar Step" para começar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step Configuration */}
        <div className="space-y-6">
          {selectedStep ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuração do Step
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Step</label>
                  <Input 
                    value={steps.find(s => s.id === selectedStep)?.name || ""}
                    onChange={(e) => {
                      setSteps(steps.map(step => 
                        step.id === selectedStep 
                          ? { ...step, name: e.target.value }
                          : step
                      ))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo do Step</label>
                  <Input 
                    value={steps.find(s => s.id === selectedStep)?.type || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Dynamic configuration based on step type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Configuração</label>
                  <Textarea 
                    placeholder="Digite a configuração do step como JSON"
                    className="min-h-32 font-mono text-sm"
                    value={JSON.stringify(
                      steps.find(s => s.id === selectedStep)?.config || {}, 
                      null, 
                      2
                    )}
                    onChange={(e) => {
                      try {
                        const config = JSON.parse(e.target.value)
                        setSteps(steps.map(step => 
                          step.id === selectedStep 
                            ? { ...step, config }
                            : step
                        ))
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Nenhum Step Selecionado</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione um step do workflow para configurar suas propriedades
                </p>
              </CardContent>
            </Card>
          )}

          {/* Workflow Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input 
                  value={workflow.name}
                  onChange={(e) => setWorkflow({...workflow, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea 
                  value={workflow.description || ""}
                  onChange={(e) => setWorkflow({...workflow, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Gatilho</label>
                <Input 
                  value={workflow.trigger === "http" ? "HTTP" : workflow.trigger === "webhook" ? "Webhook" : workflow.trigger === "schedule" ? "Agendado" : "Manual"} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={workflow.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWorkflow({...workflow, isActive: true})}
                  >
                    Ativo
                  </Button>
                  <Button
                    variant={!workflow.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWorkflow({...workflow, isActive: false})}
                  >
                    Inativo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}