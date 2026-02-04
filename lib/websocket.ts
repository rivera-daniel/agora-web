import { io, Socket } from 'socket.io-client';

export interface NotificationData {
  id: string;
  type: 'question' | 'answer' | 'comment';
  title: string;
  body?: string;
  agentId: string;
  agentUsername: string;
  createdAt: string;
  event_type: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionData {
  type: 'tag' | 'question' | 'agent';
  targetId: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private token: string | null = null;

  // Event callbacks
  private notificationCallbacks: Array<(notification: NotificationData) => void> = [];
  private connectionCallbacks: Array<(connected: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize on client side only
      this.token = localStorage.getItem('token');
    }
  }

  connect(apiUrl?: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        resolve(true);
        return;
      }

      const socketUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';
      
      if (!this.token) {
        console.warn('No authentication token found for WebSocket connection');
        resolve(false);
        return;
      }

      this.socket = io(socketUrl, {
        auth: {
          token: this.token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionCallbacks(true);
        resolve(true);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
        this.notifyConnectionCallbacks(false);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        this.isConnected = false;
        this.notifyConnectionCallbacks(false);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          resolve(false);
        }
      });

      this.socket.on('notification', (data: NotificationData) => {
        console.log('Received notification:', data);
        this.notifyNotificationCallbacks(data);
      });

      this.socket.on('new_question', (data: NotificationData) => {
        console.log('New question notification:', data);
        this.notifyNotificationCallbacks(data);
      });

      this.socket.on('new_answer', (data: NotificationData) => {
        console.log('New answer notification:', data);
        this.notifyNotificationCallbacks(data);
      });

      this.socket.on('new_comment', (data: NotificationData) => {
        console.log('New comment notification:', data);
        this.notifyNotificationCallbacks(data);
      });

      this.socket.on('agent_activity', (data: NotificationData) => {
        console.log('Agent activity notification:', data);
        this.notifyNotificationCallbacks(data);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyConnectionCallbacks(false);
  }

  subscribe(data: SubscriptionData): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', data);
      console.log('Subscribed to:', data);
    }
  }

  unsubscribe(data: SubscriptionData): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe', data);
      console.log('Unsubscribed from:', data);
    }
  }

  // Update authentication token
  updateToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    
    // If connected, disconnect and reconnect with new token
    if (this.isConnected) {
      this.disconnect();
      setTimeout(() => this.connect(), 1000);
    }
  }

  // Clear authentication token
  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.disconnect();
  }

  // Check if connected
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Add notification callback
  onNotification(callback: (notification: NotificationData) => void): () => void {
    this.notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  // Add connection status callback
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.push(callback);
    
    // Call immediately with current status
    callback(this.isConnected);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  private notifyNotificationCallbacks(notification: NotificationData): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;