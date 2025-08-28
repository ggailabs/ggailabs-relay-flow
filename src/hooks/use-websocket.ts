"use client"

import { useEffect, useRef, useState } from 'react'

interface WebSocketMessage {
  type: string
  data: any
}

interface UseWebSocketOptions {
  url?: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  autoConnect?: boolean
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/api/socketio` 
      : `ws://${window.location.host}/api/socketio`,
    onMessage,
    onConnect,
    onDisconnect,
    autoConnect = true
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        return
      }

      socketRef.current = new WebSocket(url)

      socketRef.current.onopen = () => {
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
        onConnect?.()
      }

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          // Handle different message types
          if (message.type) {
            onMessage?.(message)
          } else if (message.text) {
            // Legacy message format
            onMessage?.({
              type: 'message',
              data: message
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      socketRef.current.onclose = () => {
        setIsConnected(false)
        onDisconnect?.()

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const timeout = Math.pow(2, reconnectAttempts.current) * 1000 // Exponential backoff
          
          console.log(`WebSocket disconnected. Reconnecting in ${timeout}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, timeout)
        } else {
          setConnectionError('Failed to connect after maximum retry attempts')
        }
      }

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionError('WebSocket connection error')
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setConnectionError('Failed to create WebSocket connection')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    setIsConnected(false)
  }

  const sendMessage = (type: string, data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }))
    } else {
      console.warn('WebSocket is not connected. Cannot send message.')
    }
  }

  const subscribeToWorkflow = (workflowId: string) => {
    sendMessage('subscribe:workflow', workflowId)
  }

  const unsubscribeFromWorkflow = (workflowId: string) => {
    sendMessage('unsubscribe:workflow', workflowId)
  }

  const subscribeToExecution = (executionId: string) => {
    sendMessage('subscribe:execution', executionId)
  }

  const unsubscribeFromExecution = (executionId: string) => {
    sendMessage('unsubscribe:execution', executionId)
  }

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [url, autoConnect])

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    subscribeToWorkflow,
    unsubscribeFromWorkflow,
    subscribeToExecution,
    unsubscribeFromExecution
  }
}