"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Copy, 
  Download, 
  Eye, 
  Filter,
  Zap,
  Mail,
  Database,
  FileText,
  Clock,
  Plus,
  Star
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: "iniciante" | "intermediário" | "avançado"
  steps: number
  estimatedTime: string
  tags: string[]
  rating: number
  usageCount: number
  isPopular: boolean
  workflow: {
    trigger: string
    steps: Array<{
      type: string
      name: string
      config: any
    }>
  }
}

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "1",
    name: "Notificação por Email",
    description: "Envia emails automáticos quando novos usuários se cadastram",
    category: "comunicação",
    difficulty: "iniciante",
    steps: 2,
    estimatedTime: "5 min",
    tags: ["email", "notificação", "usuário"],
    rating: 4.8,
    usageCount: 1250,
    isPopular: true,
    workflow: {
      trigger: "webhook",
      steps: [
        {
          type: "transform",
          name: "Preparar Dados do Email",
          config: { mapping: "{email: '{{webhook.data.email}}', name: '{{webhook.data.name}}'}" }
        },
        {
          type: "email",
          name: "Enviar Email de Boas-vindas",
          config: { to: "{{transform.email}}", subject: "Bem-vindo!", body: "Olá {{transform.name}}, seja bem-vindo!" }
        }
      ]
    }
  },
  {
    id: "2",
    name: "Sincronização de API",
    description: "Sincroniza dados entre API externa e banco de dados local",
    category: "integração",
    difficulty: "intermediário",
    steps: 3,
    estimatedTime: "10 min",
    tags: ["api", "banco de dados", "sincronização"],
    rating: 4.6,
    usageCount: 890,
    isPopular: true,
    workflow: {
      trigger: "schedule",
      steps: [
        {
          type: "http_request",
          name: "Buscar Dados da API",
          config: { method: "GET", url: "https://api.example.com/data" }
        },
        {
          type: "transform",
          name: "Transformar Dados",
          config: { mapping: "{data: '{{http_request.data}}'}" }
        },
        {
          type: "database",
          name: "Salvar no Banco",
          config: { operation: "insert", table: "sync_data" }
        }
      ]
    }
  },
  {
    id: "3",
    name: "Relatório Diário",
    description: "Gera e envia relatórios diários por email",
    category: "relatórios",
    difficulty: "intermediário",
    steps: 4,
    estimatedTime: "15 min",
    tags: ["relatório", "email", "agendado"],
    rating: 4.4,
    usageCount: 654,
    isPopular: false,
    workflow: {
      trigger: "schedule",
      steps: [
        {
          type: "database",
          name: "Buscar Dados do Relatório",
          config: { operation: "select", table: "analytics", query: "SELECT * FROM daily_stats" }
        },
        {
          type: "transform",
          name: "Formatar Relatório",
          config: { template: "Relatório Diário - {{date}}" }
        },
        {
          type: "variable",
          name: "Calcular Totais",
          config: { operation: "calculate", name: "total_users", expression: "database.data.length" }
        },
        {
          type: "email",
          name: "Enviar Relatório",
          config: { to: "admin@empresa.com", subject: "Relatório Diário", body: "Total de usuários: {{variable.total_users}}" }
        }
      ]
    }
  },
  {
    id: "4",
    name: "Processamento de CSV",
    description: "Processa arquivos CSV uploadados e salva no banco",
    category: "processamento",
    difficulty: "avançado",
    steps: 5,
    estimatedTime: "20 min",
    tags: ["csv", "upload", "processamento"],
    rating: 4.2,
    usageCount: 432,
    isPopular: false,
    workflow: {
      trigger: "webhook",
      steps: [
        {
          type: "variable",
          name: "Validar Arquivo",
          config: { operation: "set", name: "file_valid", value: "{{webhook.data.file_url}}" }
        },
        {
          type: "condition",
          name: "Verificar Arquivo Válido",
          config: { condition: { operator: "not_empty", left: "{{variable.file_valid}}" } }
        },
        {
          type: "transform",
          name: "Processar CSV",
          config: { file_url: "{{variable.file_valid}}", delimiter: "," }
        },
        {
          type: "loop",
          name: "Inserir Registros",
          config: { iterations: "{{transform.row_count}}", steps: [{ type: "database", name: "Inserir Registro", config: { operation: "insert", table: "uploaded_data" } }] }
        },
        {
          type: "email",
          name: "Notificar Conclusão",
          config: { to: "admin@empresa.com", subject: "Processamento Concluído", body: "Arquivo processado com sucesso!" }
        }
      ]
    }
  },
  {
    id: "5",
    name: "Monitoramento de Sistema",
    description: "Monitora saúde do sistema e envia alertas",
    category: "monitoramento",
    difficulty: "avançado",
    steps: 6,
    estimatedTime: "25 min",
    tags: ["monitoramento", "alertas", "saúde"],
    rating: 4.7,
    usageCount: 567,
    isPopular: true,
    workflow: {
      trigger: "schedule",
      steps: [
        {
          type: "http_request",
          name: "Verificar Saúde da API",
          config: { method: "GET", url: "https://api.example.com/health" }
        },
        {
          type: "condition",
          name: "Verificar Status",
          config: { condition: { operator: "equals", left: "{{http_request.status}}", right: "200" } }
        },
        {
          type: "webhook",
          name: "Enviar Alerta (Falha)",
          config: { url: "https://alerts.example.com/health", method: "POST", data: { status: "down", service: "API" } }
        },
        {
          type: "database",
          name: "Registrar Status",
          config: { operation: "insert", table: "health_checks" }
        },
        {
          type: "delay",
          name: "Aguardar Próxima Verificação",
          config: { duration: 300000 }
        },
        {
          type: "email",
          name: "Relatório Diário de Saúde",
          config: { to: "admin@empresa.com", subject: "Relatório de Saúde do Sistema", body: "Status: {{condition.result ? 'OK' : 'FALHA'}}" }
        }
      ]
    }
  }
]

export function WorkflowTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("todas")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("todas")

  const categories = ["todas", ...Array.from(new Set(workflowTemplates.map(t => t.category)))]
  const difficulties = ["todas", "iniciante", "intermediário", "avançado"]

  const filteredTemplates = workflowTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "todas" || template.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "todas" || template.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "comunicação": return <Mail className="w-5 h-5" />
      case "integração": return <Zap className="w-5 h-5" />
      case "relatórios": return <FileText className="w-5 h-5" />
      case "processamento": return <Database className="w-5 h-5" />
      case "monitoramento": return <Clock className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "iniciante": return "bg-green-500 hover:bg-green-600"
      case "intermediário": return "bg-yellow-500 hover:bg-yellow-600"
      case "avançado": return "bg-red-500 hover:bg-red-600"
      default: return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const useTemplate = (template: WorkflowTemplate) => {
    // In a real app, this would create a new workflow from the template
    console.log("Using template:", template.name)
    // Close dialog and show success message
    setSelectedTemplate(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates de Workflows</h1>
          <p className="text-muted-foreground">
            Comece rapidamente com nossos templates pré-configurados
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Criar Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Pesquisar Templates</Label>
              <Input
                id="search"
                placeholder="Buscar por nome, descrição ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-40 px-3 py-2 border border-border rounded-md bg-background"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "todas" ? "Todas" : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="difficulty">Dificuldade</Label>
              <select
                id="difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-40 px-3 py-2 border border-border rounded-md bg-background"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === "todas" ? "Todas" : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isPopular && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {template.steps} steps
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
              
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {template.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {template.usageCount}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-yellow-500" />
                  <span>{template.rating}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedTemplate(template)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getCategoryIcon(template.category)}
                        {template.name}
                        {template.isPopular && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                      </DialogTitle>
                      <DialogDescription>
                        {template.description}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Template Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                          <p className="font-medium capitalize">{template.category}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Dificuldade</Label>
                          <Badge className={getDifficultyColor(template.difficulty)}>
                            {template.difficulty}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Passos</Label>
                          <p className="font-medium">{template.steps}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Tempo Estimado</Label>
                          <p className="font-medium">{template.estimatedTime}</p>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Workflow Preview */}
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-2">Workflow Preview</Label>
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-primary-foreground" />
                              </div>
                              <span className="font-medium">Gatilho: {template.workflow.trigger}</span>
                            </div>
                            
                            <div className="flex justify-center">
                              <div className="w-0.5 h-4 bg-border"></div>
                            </div>
                            
                            {template.workflow.steps.map((step, index) => (
                              <div key={index} className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="font-medium">{step.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {step.type}
                                  </Badge>
                                </div>
                                
                                {index < template.workflow.steps.length - 1 && (
                                  <div className="flex justify-center">
                                    <div className="w-0.5 h-4 bg-border"></div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-current text-yellow-500" />
                            {template.rating} ({template.usageCount} usos)
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar
                          </Button>
                          <Button size="sm" onClick={() => useTemplate(template)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Usar Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button size="sm" className="flex-1" onClick={() => useTemplate(template)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Usar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
          <p>Tente ajustar seus filtros ou termos de busca</p>
        </div>
      )}
    </div>
  )
}