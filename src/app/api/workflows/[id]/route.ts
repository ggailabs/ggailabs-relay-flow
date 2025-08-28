import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { id: true, email: true, name: true }
        },
        steps: {
          orderBy: { order: 'asc' },
          include: {
            inputs: true,
            outputs: true
          }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, trigger, config, isActive } = body

    const workflow = await db.workflow.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(trigger && { trigger }),
        ...(config !== undefined && { config }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        author: {
          select: { id: true, email: true, name: true }
        },
        steps: {
          orderBy: { order: 'asc' },
          include: {
            inputs: true,
            outputs: true
          }
        }
      }
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.workflow.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Workflow deleted successfully' })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}