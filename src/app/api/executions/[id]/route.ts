import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const execution = await db.execution.findUnique({
      where: { id: params.id },
      include: {
        workflow: {
          select: { id: true, name: true, trigger: true }
        },
        logs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(execution)
  } catch (error) {
    console.error('Error fetching execution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'cancel') {
      const execution = await db.execution.findUnique({
        where: { id: params.id }
      })

      if (!execution) {
        return NextResponse.json(
          { error: 'Execution not found' },
          { status: 404 }
        )
      }

      if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Execution cannot be cancelled' },
          { status: 400 }
        )
      }

      const updatedExecution = await db.execution.update({
        where: { id: params.id },
        data: { 
          status: 'CANCELLED',
          completedAt: new Date()
        },
        include: {
          workflow: {
            select: { id: true, name: true }
          },
          logs: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      return NextResponse.json(updatedExecution)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating execution:', error)
    return NextResponse.json(
      { error: 'Failed to update execution' },
      { status: 500 }
    )
  }
}