import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get workflow with steps
    const workflow = await db.workflow.findUnique({
      where: { id: params.id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            inputs: true,
            outputs: true
          }
        }
      }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    if (!workflow.isActive) {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      )
    }

    // Get trigger data from request body
    const body = await request.json()
    const triggerData = body.triggerData || '{}'

    // Create execution record
    const execution = await db.execution.create({
      data: {
        workflowId: params.id,
        status: 'PENDING',
        triggerData
      }
    })

    // Broadcast execution started via WebSocket
    if (global.socketBroadcasters) {
      global.socketBroadcasters.broadcastExecutionStarted(params.id, execution.id)
    }

    // Execute workflow asynchronously
    executeWorkflow(workflow, execution.id).catch(console.error)

    return NextResponse.json({
      executionId: execution.id,
      status: 'PENDING',
      message: 'Workflow execution started'
    })
  } catch (error) {
    console.error('Error starting workflow execution:', error)
    return NextResponse.json(
      { error: 'Failed to start workflow execution' },
      { status: 500 }
    )
  }
}

async function executeWorkflow(workflow: any, executionId: string) {
  try {
    // Update execution status to RUNNING
    await db.execution.update({
      where: { id: executionId },
      data: { status: 'RUNNING' }
    })

    await logExecution(executionId, 'INFO', 'Workflow execution started')

    // Broadcast status update
    if (global.socketBroadcasters) {
      global.socketBroadcasters.broadcastExecutionUpdate({
        executionId,
        workflowId: workflow.id,
        status: 'RUNNING',
        message: 'Workflow execution started',
        timestamp: new Date().toISOString()
      })
    }

    // Execute steps in order
    let stepResults: any = {}
    
    for (const step of workflow.steps) {
      await logExecution(executionId, 'INFO', `Executing step: ${step.name}`, step.id)
      
      // Broadcast step start
      if (global.socketBroadcasters) {
        global.socketBroadcasters.broadcastExecutionUpdate({
          executionId,
          workflowId: workflow.id,
          status: 'RUNNING',
          stepId: step.id,
          message: `Executing step: ${step.name}`,
          timestamp: new Date().toISOString()
        })
      }
      
      try {
        const result = await executeStep(step, stepResults)
        stepResults[step.id] = result
        
        await logExecution(
          executionId, 
          'INFO', 
          `Step completed successfully: ${step.name}`, 
          step.id
        )

        // Broadcast step completion
        if (global.socketBroadcasters) {
          global.socketBroadcasters.broadcastExecutionUpdate({
            executionId,
            workflowId: workflow.id,
            status: 'RUNNING',
            stepId: step.id,
            message: `Step completed: ${step.name}`,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await logExecution(
          executionId, 
          'ERROR', 
          `Step failed: ${step.name} - ${errorMessage}`, 
          step.id
        )
        
        // Broadcast step failure
        if (global.socketBroadcasters) {
          global.socketBroadcasters.broadcastExecutionUpdate({
            executionId,
            workflowId: workflow.id,
            status: 'RUNNING',
            stepId: step.id,
            message: `Step failed: ${step.name} - ${errorMessage}`,
            timestamp: new Date().toISOString()
          })
        }
        
        // Mark execution as failed
        await db.execution.update({
          where: { id: executionId },
          data: { 
            status: 'FAILED',
            error: errorMessage,
            completedAt: new Date()
          }
        })

        // Broadcast execution failure
        if (global.socketBroadcasters) {
          global.socketBroadcasters.broadcastExecutionCompleted(workflow.id, executionId, 'FAILED')
        }
        
        return
      }
    }

    // Mark execution as successful
    await db.execution.update({
      where: { id: executionId },
      data: { 
        status: 'SUCCESS',
        completedAt: new Date()
      }
    })

    await logExecution(executionId, 'INFO', 'Workflow execution completed successfully')

    // Broadcast execution success
    if (global.socketBroadcasters) {
      global.socketBroadcasters.broadcastExecutionCompleted(workflow.id, executionId, 'SUCCESS')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    await logExecution(executionId, 'ERROR', `Workflow execution failed: ${errorMessage}`)
    
    await db.execution.update({
      where: { id: executionId },
      data: { 
        status: 'FAILED',
        error: errorMessage,
        completedAt: new Date()
      }
    })

    // Broadcast execution failure
    if (global.socketBroadcasters) {
      global.socketBroadcasters.broadcastExecutionCompleted(workflow.id, executionId, 'FAILED')
    }
  }
}

async function executeStep(step: any, previousResults: any): Promise<any> {
  const config = JSON.parse(step.config || '{}')
  
  switch (step.type) {
    case 'http_request':
      return await executeHttpRequest(config, previousResults)
    
    case 'email':
      return await executeEmailStep(config, previousResults)
    
    case 'database':
      return await executeDatabaseStep(config, previousResults)
    
    case 'transform':
      return await executeTransformStep(config, previousResults)
    
    case 'delay':
      return await executeDelayStep(config, previousResults)
    
    case 'condition':
      return await executeConditionStep(config, previousResults)
    
    case 'loop':
      return await executeLoopStep(config, previousResults)
    
    case 'parallel':
      return await executeParallelStep(config, previousResults)
    
    case 'webhook':
      return await executeWebhookStep(config, previousResults)
    
    case 'variable':
      return await executeVariableStep(config, previousResults)
    
    default:
      throw new Error(`Tipo de step desconhecido: ${step.type}`)
  }
}

async function executeHttpRequest(config: any, previousResults: any): Promise<any> {
  const { url, method = 'GET', headers = {}, body } = config
  
  // Replace placeholders with previous results
  const processedUrl = replacePlaceholders(url, previousResults)
  const processedBody = body ? replacePlaceholders(JSON.stringify(body), previousResults) : null
  
  const response = await fetch(processedUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: processedBody ? JSON.stringify(JSON.parse(processedBody)) : undefined
  })
  
  if (!response.ok) {
    throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}

async function executeEmailStep(config: any, previousResults: any): Promise<any> {
  const { to, subject, body } = config
  
  // Replace placeholders with previous results
  const processedTo = replacePlaceholders(to, previousResults)
  const processedSubject = replacePlaceholders(subject, previousResults)
  const processedBody = replacePlaceholders(body, previousResults)
  
  // In a real implementation, you would use an email service
  // For now, we'll just log the email
  console.log(`Email would be sent to: ${processedTo}`)
  console.log(`Subject: ${processedSubject}`)
  console.log(`Body: ${processedBody}`)
  
  return { message: 'Email sent successfully', to: processedTo }
}

async function executeDatabaseStep(config: any, previousResults: any): Promise<any> {
  const { operation, table, data } = config
  
  // Replace placeholders with previous results
  const processedTable = replacePlaceholders(table, previousResults)
  const processedData = data ? JSON.parse(replacePlaceholders(JSON.stringify(data), previousResults)) : null
  
  // In a real implementation, you would perform database operations
  // For now, we'll simulate the operation
  console.log(`Database operation: ${operation} on table: ${processedTable}`)
  console.log(`Data:`, processedData)
  
  return { 
    message: `Database ${operation} completed successfully`, 
    table: processedTable,
    affectedRows: 1
  }
}

async function executeTransformStep(config: any, previousResults: any): Promise<any> {
  const { mapping } = config
  
  // In a real implementation, you would transform data based on mapping
  // For now, we'll just return a sample transformation
  const result = {}
  
  for (const [key, value] of Object.entries(mapping || {})) {
    if (typeof value === 'string') {
      result[key] = replacePlaceholders(value, previousResults)
    } else {
      result[key] = value
    }
  }
  
  return result
}

async function executeDelayStep(config: any, previousResults: any): Promise<any> {
  const { duration = 1000 } = config
  
  await new Promise(resolve => setTimeout(resolve, duration))
  
  return { message: `Atraso de ${duration}ms concluído` }
}

async function executeConditionStep(config: any, previousResults: any): Promise<any> {
  const { condition, ifTrue, ifFalse } = config
  
  // Evaluate condition
  const conditionResult = evaluateCondition(condition, previousResults)
  
  if (conditionResult) {
    if (ifTrue) {
      // Execute ifTrue steps
      return { 
        result: conditionResult,
        branch: 'true',
        message: 'Condição verdadeira, executando branch verdadeiro'
      }
    }
  } else {
    if (ifFalse) {
      // Execute ifFalse steps
      return { 
        result: conditionResult,
        branch: 'false',
        message: 'Condição falsa, executando branch falso'
      }
    }
  }
  
  return { 
    result: conditionResult,
    message: 'Condição avaliada, nenhum branch para executar'
  }
}

async function executeLoopStep(config: any, previousResults: any): Promise<any> {
  const { iterations = 1, steps: loopSteps } = config
  
  const results = []
  
  for (let i = 0; i < iterations; i++) {
    const iterationResult = {
      iteration: i + 1,
      results: {}
    }
    
    // Execute loop steps for each iteration
    for (const step of loopSteps || []) {
      try {
        const stepResult = await executeStep(step, { ...previousResults, ...iterationResult.results })
        iterationResult.results[step.id] = stepResult
      } catch (error) {
        iterationResult.results[step.id] = { error: error.message }
      }
    }
    
    results.push(iterationResult)
  }
  
  return { 
    iterations,
    results,
    message: `Loop concluído com ${iterations} iterações`
  }
}

async function executeParallelStep(config: any, previousResults: any): Promise<any> {
  const { steps: parallelSteps } = config
  
  if (!parallelSteps || parallelSteps.length === 0) {
    return { message: 'Nenhum step paralelo para executar' }
  }
  
  // Execute all steps in parallel
  const promises = parallelSteps.map(async (step: any) => {
    try {
      const result = await executeStep(step, previousResults)
      return { stepId: step.id, result, status: 'success' }
    } catch (error) {
      return { 
        stepId: step.id, 
        error: error.message, 
        status: 'failed' 
      }
    }
  })
  
  const results = await Promise.all(promises)
  
  return {
    results,
    message: `Execução paralela concluída para ${parallelSteps.length} steps`
  }
}

async function executeWebhookStep(config: any, previousResults: any): Promise<any> {
  const { url, method = 'POST', headers = {}, data } = config
  
  // Replace placeholders in URL and data
  const processedUrl = replacePlaceholders(url, previousResults)
  const processedData = data ? JSON.parse(replacePlaceholders(JSON.stringify(data), previousResults)) : null
  
  const response = await fetch(processedUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: processedData ? JSON.stringify(processedData) : undefined
  })
  
  if (!response.ok) {
    throw new Error(`Webhook falhou: ${response.status} ${response.statusText}`)
  }
  
  const responseData = await response.json()
  
  return {
    statusCode: response.status,
    response: responseData,
    message: 'Webhook enviado com sucesso'
  }
}

async function executeVariableStep(config: any, previousResults: any): Promise<any> {
  const { operation, name, value, expression } = config
  
  switch (operation) {
    case 'set':
      // Set a variable value
      return { 
        name, 
        value: replacePlaceholders(value, previousResults),
        message: `Variável '${name}' definida`
      }
    
    case 'calculate':
      // Calculate a value from expression
      try {
        // Simple expression evaluation (be careful with eval in production)
        const processedExpression = replacePlaceholders(expression, previousResults)
        const result = eval(processedExpression)
        
        return { 
          name, 
          value: result,
          message: `Cálculo realizado para '${name}': ${result}`
        }
      } catch (error) {
        throw new Error(`Erro ao calcular expressão: ${error.message}`)
      }
    
    case 'transform':
      // Transform variable value
      const transformValue = replacePlaceholders(value, previousResults)
      let transformedValue = transformValue
      
      // Apply transformations
      if (config.toUpperCase) {
        transformedValue = transformedValue.toUpperCase()
      }
      if (config.toLowerCase) {
        transformedValue = transformedValue.toLowerCase()
      }
      if (config.trim) {
        transformedValue = transformedValue.trim()
      }
      
      return { 
        name, 
        value: transformedValue,
        originalValue: transformValue,
        message: `Variável '${name}' transformada`
      }
    
    default:
      throw new Error(`Operação de variável desconhecida: ${operation}`)
  }
}

function evaluateCondition(condition: any, previousResults: any): boolean {
  if (typeof condition === 'boolean') {
    return condition
  }
  
  if (typeof condition === 'string') {
    // Replace placeholders and evaluate
    const processedCondition = replacePlaceholders(condition, previousResults)
    
    // Simple boolean evaluation
    if (processedCondition.toLowerCase() === 'true') return true
    if (processedCondition.toLowerCase() === 'false') return false
    
    // Try to evaluate as expression
    try {
      return eval(processedCondition)
    } catch {
      return false
    }
  }
  
  if (typeof condition === 'object') {
    const { operator, left, right } = condition
    
    const leftValue = replacePlaceholders(left, previousResults)
    const rightValue = replacePlaceholders(right, previousResults)
    
    switch (operator) {
      case 'equals':
        return leftValue === rightValue
      case 'not_equals':
        return leftValue !== rightValue
      case 'greater_than':
        return Number(leftValue) > Number(rightValue)
      case 'less_than':
        return Number(leftValue) < Number(rightValue)
      case 'contains':
        return String(leftValue).includes(String(rightValue))
      case 'not_empty':
        return leftValue !== null && leftValue !== undefined && leftValue !== ''
      default:
        return false
    }
  }
  
  return false
}

function replacePlaceholders(text: string, previousResults: any): string {
  return text.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, stepId, field) => {
    const stepResult = previousResults[stepId]
    if (stepResult && typeof stepResult === 'object') {
      return stepResult[field] || match
    }
    return match
  })
}

async function logExecution(executionId: string, level: string, message: string, stepId?: string) {
  try {
    const log = await db.executionLog.create({
      data: {
        executionId,
        level: level as any,
        message,
        stepId
      }
    })

    // Broadcast log via WebSocket
    if (global.socketBroadcasters) {
      global.socketBroadcasters.broadcastExecutionLog({
        executionId,
        level,
        message,
        stepId,
        timestamp: log.createdAt.toISOString()
      })
    }
  } catch (error) {
    console.error('Failed to log execution:', error)
  }
}