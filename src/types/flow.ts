export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author: User;
  nodes: Node[];
  connections: Connection[];
}

export interface Node {
  id: string;
  flowId: string;
  type: "trigger" | "action" | "condition" | "delay" | "webhook" | "transform" | "filter";
  title: string;
  positionX: number;
  positionY: number;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sourceConnections: Connection[];
  targetConnections: Connection[];
}

export interface Connection {
  id: string;
  flowId: string;
  sourceId: string;
  targetId: string;
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sourceNode: Node;
  targetNode: Node;
}