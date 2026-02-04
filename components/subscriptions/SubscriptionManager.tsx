'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

interface Subscription {
  id: string;
  type: 'tag' | 'question' | 'agent';
  targetId: string;
  isActive: boolean;
  createdAt: string;
}

interface SubscriptionManagerProps {
  agentId: string;
  apiUrl?: string;
  authToken?: string;
}

export function SubscriptionManager({ agentId, apiUrl = 'http://localhost:3500', authToken }: SubscriptionManagerProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSubscription, setNewSubscription] = useState({
    type: 'tag' as 'tag' | 'question' | 'agent',
    targetId: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const { subscribe, unsubscribe, isConnected } = useWebSocket();

  // Fetch subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, [agentId]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/subscriptions/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setSubscriptions(data.data.subscriptions || []);
        
        // Auto-subscribe to active subscriptions via WebSocket
        if (isConnected) {
          data.data.subscriptions
            .filter((sub: Subscription) => sub.isActive)
            .forEach((sub: Subscription) => {
              subscribe({ type: sub.type, targetId: sub.targetId });
            });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch subscriptions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!newSubscription.targetId.trim()) {
      setError('Please enter a target ID');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newSubscription.type,
          target_id: newSubscription.targetId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add to local state
        setSubscriptions(prev => [data.data, ...prev]);
        
        // Subscribe via WebSocket
        if (isConnected && data.data.isActive) {
          subscribe({ 
            type: data.data.type, 
            targetId: data.data.targetId 
          });
        }

        // Reset form
        setNewSubscription({
          type: 'tag',
          targetId: '',
        });
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleSubscription = async (subscriptionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${apiUrl}/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setSubscriptions(prev =>
          prev.map(sub =>
            sub.id === subscriptionId
              ? { ...sub, isActive: !isActive }
              : sub
          )
        );

        // Update WebSocket subscription
        const subscription = subscriptions.find(sub => sub.id === subscriptionId);
        if (subscription) {
          if (!isActive && isConnected) {
            // Activating subscription
            subscribe({ 
              type: subscription.type, 
              targetId: subscription.targetId 
            });
          } else if (isActive && isConnected) {
            // Deactivating subscription
            unsubscribe({ 
              type: subscription.type, 
              targetId: subscription.targetId 
            });
          }
        }
      } else {
        throw new Error(data.error || 'Failed to update subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Find subscription before removing
        const subscription = subscriptions.find(sub => sub.id === subscriptionId);
        
        // Remove from local state
        setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));

        // Unsubscribe via WebSocket
        if (subscription && subscription.isActive && isConnected) {
          unsubscribe({ 
            type: subscription.type, 
            targetId: subscription.targetId 
          });
        }
      } else {
        throw new Error(data.error || 'Failed to delete subscription');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tag':
        return '🏷️';
      case 'question':
        return '❓';
      case 'agent':
        return '👤';
      default:
        return '📌';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Real-time Subscriptions
        <div className={`inline-block ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Create New Subscription */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Add New Subscription</h3>
        <div className="flex gap-3">
          <select
            value={newSubscription.type}
            onChange={(e) => setNewSubscription({ ...newSubscription, type: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="tag">Tag</option>
            <option value="question">Question</option>
            <option value="agent">Agent</option>
          </select>
          
          <input
            type="text"
            placeholder={
              newSubscription.type === 'tag' ? 'Enter tag name...' :
              newSubscription.type === 'question' ? 'Enter question ID...' :
              'Enter agent ID...'
            }
            value={newSubscription.targetId}
            onChange={(e) => setNewSubscription({ ...newSubscription, targetId: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={createSubscription}
            disabled={isCreating || !newSubscription.targetId.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No subscriptions yet</p>
            <p className="text-sm mt-1">Add a subscription above to get real-time notifications</p>
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <div key={subscription.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getTypeIcon(subscription.type)}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {subscription.type}: {subscription.targetId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created {new Date(subscription.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSubscription(subscription.id, subscription.isActive)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.isActive
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {subscription.isActive ? 'Active' : 'Inactive'}
                </button>
                
                <button
                  onClick={() => deleteSubscription(subscription.id)}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                  title="Delete subscription"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SubscriptionManager;