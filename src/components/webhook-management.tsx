"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Trash2, 
  Copy, 
  ExternalLink,
  Settings,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Webhook {
  id: string
  name: string
  url: string
  method: string
  headers: Record<string, string>
  isActive: boolean
  createdAt: string
  lastCalled?: string
  callCount: number
  description?: string
}

// Mock webhook data
const mockWebhooks: Webhook[] = [
  {
    id: "1",
    name: "Notificação Slack",
    url: "https://hooks.slack.com/services/xxx",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    isActive: true,
    createdAt: "2024-01-15T10:30:00Z",
    lastCalled: "2024-01-15T14:22:00Z",
    callCount: 45,
    description: "Envia notificações para canal do Slack"
  },
  {
    id: "2",
    name: "Webhook Discord",
    url: "https://discord.com/api/webhooks/xxx",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    isActive: true,
    createdAt: "2024-01-14T15:20:00Z",
    lastCalled: "2024-01-15T13:45:00Z",
    callCount: 23,
    description: "Envia atualizações para servidor Discord"
  },
  {
    id: "3",
    name: "Integração ERP",
    url: "https://api.empresa.com/webhook",
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer xxx"
    },
    isActive: false,
    createdAt: "2024-01-10T09:15:00Z",
    lastCalled: "2024-01-12T16:30:00Z",
    callCount: 12,
    description: "Integração com sistema ERP da empresa"
  }
]

export function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)

  const handleCreateWebhook = (webhookData: Omit<Webhook, 'id' | 'createdAt' | 'callCount'>) => {
    const newWebhook: Webhook = {
      ...webhookData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      callCount: 0
    }
    setWebhooks([...webhooks, newWebhook])
    setIsCreateDialogOpen(false)
  }

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id))
  }

  const handleToggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Webhooks</h1>
          <p className="text-muted-foreground">
            Configure e gerencie webhooks para integrações externas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
              <DialogDescription>
                Configure um novo webhook para receber notificações
              </DialogDescription>
            </DialogHeader>
            <WebhookForm onSubmit={handleCreateWebhook} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Webhooks</p>
                <p className="text-2xl font-bold">{webhooks.length}</p>
              </div>
              <ExternalLink className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">
                  {webhooks.filter(w => w.isActive).length}
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
                <p className="text-sm font-medium text-muted-foreground">Chamadas Totais</p>
                <p className="text-2xl font-bold">
                  {webhooks.reduce((sum, w) => sum + w.callCount, 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold">
                  {webhooks.filter(w => !w.isActive).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks Configurados</CardTitle>
          <CardDescription>
            Lista de todos os webhooks configurados na sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chamadas</TableHead>
                <TableHead>Última Chamada</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{webhook.name}</div>
                      {webhook.description && (
                        <div className="text-sm text-muted-foreground">
                          {webhook.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {webhook.url.length > 40 
                          ? webhook.url.substring(0, 40) + '...' 
                          : webhook.url
                        }
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(webhook.url)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{webhook.method}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={webhook.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}
                    >
                      {webhook.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{webhook.callCount}</TableCell>
                  <TableCell>
                    {webhook.lastCalled 
                      ? new Date(webhook.lastCalled).toLocaleDateString()
                      : "Nunca"
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleWebhook(webhook.id)}
                      >
                        {webhook.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWebhook(webhook)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Webhook Details Dialog */}
      {selectedWebhook && (
        <Dialog open={!!selectedWebhook} onOpenChange={() => setSelectedWebhook(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Webhook</DialogTitle>
              <DialogDescription>
                Informações detalhadas do webhook {selectedWebhook.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                  <p className="font-medium">{selectedWebhook.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Método</Label>
                  <Badge variant="outline">{selectedWebhook.method}</Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">URL</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {selectedWebhook.url}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedWebhook.url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {selectedWebhook.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                  <p>{selectedWebhook.description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Headers</Label>
                <div className="bg-muted p-3 rounded">
                  <pre className="text-sm">
                    {JSON.stringify(selectedWebhook.headers, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge 
                    className={selectedWebhook.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}
                  >
                    {selectedWebhook.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Chamadas</Label>
                  <p className="font-medium">{selectedWebhook.callCount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                  <p className="font-medium">
                    {new Date(selectedWebhook.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface WebhookFormProps {
  onSubmit: (webhook: Omit<Webhook, 'id' | 'createdAt' | 'callCount'>) => void
}

function WebhookForm({ onSubmit }: WebhookFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    isActive: true,
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const addHeader = () => {
    setFormData(prev => ({
      ...prev,
      headers: { ...prev.headers, '': '' }
    }))
  }

  const updateHeader = (key: string, value: string, newKey?: string) => {
    setFormData(prev => {
      const headers = { ...prev.headers }
      if (newKey !== undefined) {
        headers[newKey] = value
        delete headers[key]
      } else {
        headers[key] = value
      }
      return { ...prev, headers }
    })
  }

  const removeHeader = (key: string) => {
    setFormData(prev => {
      const headers = { ...prev.headers }
      delete headers[key]
      return { ...prev, headers }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Nome do webhook"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="method">Método HTTP</Label>
          <select
            id="method"
            value={formData.method}
            onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL do Webhook</Label>
        <Input
          id="url"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://sua-api.com/webhook"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição do webhook"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Headers HTTP</Label>
          <Button type="button" variant="outline" size="sm" onClick={addHeader}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Header
          </Button>
        </div>
        <div className="space-y-2">
          {Object.entries(formData.headers).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <Input
                value={key}
                onChange={(e) => updateHeader(key, value, e.target.value)}
                placeholder="Nome do header"
                className="flex-1"
              />
              <Input
                value={value}
                onChange={(e) => updateHeader(key, e.target.value)}
                placeholder="Valor do header"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeHeader(key)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="isActive">Webhook ativo</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onSubmit({ ...formData })}>
          Cancelar
        </Button>
        <Button type="submit">Criar Webhook</Button>
      </div>
    </form>
  )
}