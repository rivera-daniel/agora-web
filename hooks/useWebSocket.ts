import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, NotificationData, SubscriptionData } from '../lib/websocket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  subscriptions?: SubscriptionData[];
}

interface UseWebSocketReturn {
  isConnected: boolean;
  notifications: NotificationData[];
  connect: () => Promise<boolean>;
  disconnect: () => void;
  subscribe: (subscription: SubscriptionData) => void;
  unsubscribe: (subscription: SubscriptionData) => void;
  clearNotifications: () => void;
  updateToken: (token: string) => void;
  clearToken: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = false, subscriptions = [] } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  
  const notificationUnsubscribeRef = useRef<(() => void) | null>(null);
  const connectionUnsubscribeRef = useRef<(() => void) | null>(null);
  const currentSubscriptionsRef = useRef<SubscriptionData[]>([]);

  // Initialize WebSocket event listeners
  useEffect(() => {
    // Set up notification listener
    notificationUnsubscribeRef.current = websocketService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
    });

    // Set up connection status listener
    connectionUnsubscribeRef.current = websocketService.onConnectionChange((connected) => {
      setIsConnected(connected);
      
      // Re-subscribe to subscriptions when reconnecting
      if (connected && currentSubscriptionsRef.current.length > 0) {
        currentSubscriptionsRef.current.forEach(sub => {
          websocketService.subscribe(sub);
        });
      }
    });

    // Auto-connect if enabled
    if (autoConnect) {
      websocketService.connect();
    }

    return () => {
      // Clean up listeners
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
      }
      if (connectionUnsubscribeRef.current) {
        connectionUnsubscribeRef.current();
      }
    };
  }, [autoConnect]);

  // Handle initial subscriptions
  useEffect(() => {
    if (subscriptions.length > 0) {
      currentSubscriptionsRef.current = subscriptions;
      
      if (isConnected) {
        subscriptions.forEach(sub => {
          websocketService.subscribe(sub);
        });
      }
    }
  }, [subscriptions, isConnected]);

  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const success = await websocketService.connect();
      return success;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      return false;
    }
  }, []);

  const disconnect = useCallback((): void => {
    websocketService.disconnect();
    currentSubscriptionsRef.current = [];
  }, []);

  const subscribe = useCallback((subscription: SubscriptionData): void => {
    // Add to current subscriptions
    currentSubscriptionsRef.current = [
      ...currentSubscriptionsRef.current.filter(
        sub => !(sub.type === subscription.type && sub.targetId === subscription.targetId)
      ),
      subscription
    ];

    // Subscribe if connected
    if (isConnected) {
      websocketService.subscribe(subscription);
    }
  }, [isConnected]);

  const unsubscribe = useCallback((subscription: SubscriptionData): void => {
    // Remove from current subscriptions
    currentSubscriptionsRef.current = currentSubscriptionsRef.current.filter(
      sub => !(sub.type === subscription.type && sub.targetId === subscription.targetId)
    );

    // Unsubscribe if connected
    if (isConnected) {
      websocketService.unsubscribe(subscription);
    }
  }, [isConnected]);

  const clearNotifications = useCallback((): void => {
    setNotifications([]);
  }, []);

  const updateToken = useCallback((token: string): void => {
    websocketService.updateToken(token);
  }, []);

  const clearToken = useCallback((): void => {
    websocketService.clearToken();
    currentSubscriptionsRef.current = [];
  }, []);

  return {
    isConnected,
    notifications,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    clearNotifications,
    updateToken,
    clearToken,
  };
}

export default useWebSocket;