import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Create demo user if not exists
    const demoUser = await db.user.upsert({
      where: { email: 'demo@flowrelay.com' },
      update: {},
      create: {
        id: '1',
        email: 'demo@flowrelay.com',
        name: 'Usuário Demo'
      }
    })

    // Sample workflows
    const sampleWorkflows = [
      {
        id: '1',
        name: 'Sincronização de API',
        description: 'Sincroniza dados entre API externa e banco de dados local',
        trigger: 'http',
        config: JSON.stringify({
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/posts'
        }),
        authorId: demoUser.id,
        isActive: true
      },
      {
        id: '2',
        name: 'Notificações por Email',
        description: 'Envia emails automáticos para novos cadastros de usuários',
        trigger: 'webhook',
        config: JSON.stringify({
          webhookUrl: '/api/webhooks/user-signup'
        }),
        authorId: demoUser.id,
        isActive: false
      },
      {
        id: '3',
        name: 'Gerador de Relatórios Diários',
        description: 'Gera e envia relatórios de analytics por email',
        trigger: 'schedule',
        config: JSON.stringify({
          schedule: '0 9 * * *' // Daily at 9 AM
        }),
        authorId: demoUser.id,
        isActive: true
      }
    ]

    // Create workflows
    for (const workflowData of sampleWorkflows) {
      const workflow = await db.workflow.upsert({
        where: { id: workflowData.id },
        update: {
          name: workflowData.name,
          description: workflowData.description,
          trigger: workflowData.trigger,
          config: workflowData.config,
          isActive: workflowData.isActive
        },
        create: workflowData
      })

      // Add sample steps for first workflow
      if (workflowData.id === '1') {
        // Clear existing steps first
        await db.workflowStep.deleteMany({
          where: { workflowId: workflow.id }
        })

        const sampleSteps = [
          {
            id: '1-1',
            name: 'Buscar Dados da API',
            type: 'http_request',
            config: JSON.stringify({
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/posts'
            }),
            order: 1,
            workflowId: workflow.id
          },
          {
            id: '1-2',
            name: 'Transformar Dados',
            type: 'transform',
            config: JSON.stringify({
              mapping: {
                title: '{{1-1.title}}',
                body: '{{1-1.body}}'
              }
            }),
            order: 2,
            workflowId: workflow.id
          },
          {
            id: '1-3',
            name: 'Salvar no Banco',
            type: 'database',
            config: JSON.stringify({
              operation: 'insert',
              table: 'processed_posts'
            }),
            order: 3,
            workflowId: workflow.id
          }
        ]

        await db.workflowStep.createMany({
          data: sampleSteps
        })
      }

      // Add sample steps for second workflow
      if (workflowData.id === '2') {
        await db.workflowStep.deleteMany({
          where: { workflowId: workflow.id }
        })

        const sampleSteps = [
          {
            id: '2-1',
            name: 'Receber Dados do Webhook',
            type: 'webhook',
            config: JSON.stringify({
              expectedFields: ['email', 'name']
            }),
            order: 1,
            workflowId: workflow.id
          },
          {
            id: '2-2',
            name: 'Enviar Email de Boas-vindas',
            type: 'email',
            config: JSON.stringify({
              to: '{{2-1.email}}',
              subject: 'Bem-vindo ao nosso serviço!',
              body: 'Olá {{2-1.name}}, obrigado por se cadastrar!'
            }),
            order: 2,
            workflowId: workflow.id
          }
        ]

        await db.workflowStep.createMany({
          data: sampleSteps
        })
      }

      // Add sample steps for third workflow
      if (workflowData.id === '3') {
        await db.workflowStep.deleteMany({
          where: { workflowId: workflow.id }
        })

        const sampleSteps = [
          {
            id: '3-1',
            name: 'Buscar Dados de Analytics',
            type: 'database',
            config: JSON.stringify({
              operation: 'select',
              table: 'analytics_data',
              query: 'SELECT * FROM analytics_data WHERE date >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
            }),
            order: 1,
            workflowId: workflow.id
          },
          {
            id: '3-2',
            name: 'Gerar Relatório',
            type: 'transform',
            config: JSON.stringify({
              template: 'Relatório Diário - {{date}}',
              format: 'html'
            }),
            order: 2,
            workflowId: workflow.id
          },
          {
            id: '3-3',
            name: 'Enviar Relatório por Email',
            type: 'email',
            config: JSON.stringify({
              to: 'admin@company.com',
              subject: 'Relatório Diário de Analytics',
              body: '{{3-2.report}}'
            }),
            order: 3,
            workflowId: workflow.id
          }
        ]

        await db.workflowStep.createMany({
          data: sampleSteps
        })
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      user: demoUser,
      workflows: sampleWorkflows.length
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}