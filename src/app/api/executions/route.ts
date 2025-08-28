import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const workflowId = searchParams.get('workflowId')
    const status = searchParams.get('status')
    const offset = (page - 1) * limit

    const where: any = {}
    if (workflowId) {
      where.workflowId = workflowId
    }
    if (status) {
      where.status = status
    }

    const executions = await db.execution.findMany({
      where,
      include: {
        workflow: {
          select: { id: true, name: true }
        },
        logs: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { startedAt: 'desc' },
      skip: offset,
      take: limit
    })

    const total = await db.execution.count({ where })

    return NextResponse.json({
      executions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    )
  }
}