import { Server } from 'socket.io';

interface ExecutionUpdate {
  executionId: string;
  workflowId: string;
  status: string;
  stepId?: string;
  message: string;
  timestamp: string;
}

interface ExecutionLog {
  executionId: string;
  level: string;
  message: string;
  stepId?: string;
  timestamp: string;
}

export const setupSocket = (io: Server) => {
  // Store active subscriptions
  const workflowSubscriptions = new Map<string, Set<string>>();
  const executionSubscriptions = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Subscribe to workflow execution updates
    socket.on('subscribe:workflow', (workflowId: string) => {
      console.log(`Client ${socket.id} subscribed to workflow ${workflowId}`);
      
      if (!workflowSubscriptions.has(workflowId)) {
        workflowSubscriptions.set(workflowId, new Set());
      }
      workflowSubscriptions.get(workflowId)!.add(socket.id);
      
      socket.join(`workflow:${workflowId}`);
    });

    // Unsubscribe from workflow updates
    socket.on('unsubscribe:workflow', (workflowId: string) => {
      console.log(`Client ${socket.id} unsubscribed from workflow ${workflowId}`);
      
      const subscribers = workflowSubscriptions.get(workflowId);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          workflowSubscriptions.delete(workflowId);
        }
      }
      
      socket.leave(`workflow:${workflowId}`);
    });

    // Subscribe to specific execution updates
    socket.on('subscribe:execution', (executionId: string) => {
      console.log(`Client ${socket.id} subscribed to execution ${executionId}`);
      
      if (!executionSubscriptions.has(executionId)) {
        executionSubscriptions.set(executionId, new Set());
      }
      executionSubscriptions.get(executionId)!.add(socket.id);
      
      socket.join(`execution:${executionId}`);
    });

    // Unsubscribe from execution updates
    socket.on('unsubscribe:execution', (executionId: string) => {
      console.log(`Client ${socket.id} unsubscribed from execution ${executionId}`);
      
      const subscribers = executionSubscriptions.get(executionId);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          executionSubscriptions.delete(executionId);
        }
      }
      
      socket.leave(`execution:${executionId}`);
    });

    // Handle legacy messages for backward compatibility
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Clean up subscriptions
      workflowSubscriptions.forEach((subscribers, workflowId) => {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          workflowSubscriptions.delete(workflowId);
        }
      });
      
      executionSubscriptions.forEach((subscribers, executionId) => {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          executionSubscriptions.delete(executionId);
        }
      });
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Flow Relay WebSocket Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });

  // Helper functions to broadcast updates
  return {
    // Broadcast execution status update
    broadcastExecutionUpdate: (update: ExecutionUpdate) => {
      io.to(`workflow:${update.workflowId}`).emit('execution:update', update);
      io.to(`execution:${update.executionId}`).emit('execution:update', update);
    },

    // Broadcast new execution log
    broadcastExecutionLog: (log: ExecutionLog) => {
      io.to(`execution:${log.executionId}`).emit('execution:log', log);
    },

    // Broadcast workflow execution started
    broadcastExecutionStarted: (workflowId: string, executionId: string) => {
      io.to(`workflow:${workflowId}`).emit('execution:started', {
        workflowId,
        executionId,
        timestamp: new Date().toISOString()
      });
    },

    // Broadcast workflow execution completed
    broadcastExecutionCompleted: (workflowId: string, executionId: string, status: string) => {
      io.to(`workflow:${workflowId}`).emit('execution:completed', {
        workflowId,
        executionId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  };
};