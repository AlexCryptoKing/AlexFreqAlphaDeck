/**
 * WebSocket hook for real-time updates.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

interface WebSocketMessage {
  type: string;
  bot_id?: string;
  data?: unknown;
  timestamp?: string;
  channel?: string;
}

interface UseWebSocketOptions {
  channel?: string;
  onMessage?: (message: WebSocketMessage) => void;
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { channel = 'global', onMessage, enabled = true } = options;
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback(() => {
    const token = api.getAccessToken();
    if (!token || !enabled || !isAuthenticated) return;

    // Clean up existing connection - but only if it's actually open or connecting
    if (wsRef.current) {
      const state = wsRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        wsRef.current.close(1000, 'Reconnecting');
        wsRef.current = null;
      }
    }

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Prefer the runtime-configured backend origin (Capacitor APK use-case).
    // Fallback to build-time env VITE_API_URL or current host.
    const backendOrigin = localStorage.getItem('dashboard_backend_origin') || '';
    const normOrigin = backendOrigin.trim().replace(/\/+$/, '');

    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

    // Determine host:port
    const host = normOrigin
      ? normOrigin.replace(/^https?:\/\//, '')
      : (apiUrl?.replace(/^https?:\/\//, '').replace(/\/api\/v1\/?$/, '') || window.location.host);

    const wsUrl = `${protocol}//${host}/api/v1/ws?token=${token}&channel=${channel}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Check if this websocket is still the current one
        if (wsRef.current !== ws) {
          ws.close();
          return;
        }
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0; // Reset on successful connection
        console.log('[WebSocket] Connected to', channel);
      };

      ws.onclose = (event) => {
        // Only handle if this is still the current websocket
        if (wsRef.current !== ws) return;

        setIsConnected(false);
        console.log('[WebSocket] Disconnected:', event.code, event.reason);

        // Reconnect unless explicitly closed or unauthorized
        if (event.code !== 4001 && event.code !== 1000) {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
          const baseDelay = 1000;
          const maxDelay = 30000;
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxDelay);
          reconnectAttemptsRef.current += 1;

          console.log(`[WebSocket] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (event.code === 4001) {
          setConnectionError('Authentication failed');
        }
      };

      ws.onerror = (error) => {
        // Only log if this is still the current websocket
        if (wsRef.current !== ws) return;
        console.error('[WebSocket] Error:', error);
        setConnectionError('Connection error');
      };

      ws.onmessage = (event) => {
        // Only handle if this is still the current websocket
        if (wsRef.current !== ws) return;
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          handleMessage(message);
          onMessage?.(message);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };
    } catch (e) {
      console.error('[WebSocket] Failed to connect:', e);
      setConnectionError('Failed to connect');
    }
  }, [channel, enabled, isAuthenticated, onMessage]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'metrics_update':
        if (message.bot_id) {
          // Only invalidate metrics for this specific bot - don't reload entire bot list
          queryClient.invalidateQueries({ queryKey: ['bot', message.bot_id, 'metrics'] });
          // Note: We don't invalidate ['bots'] here to avoid unnecessary re-renders
          // The individual bot metrics are fetched separately via useBotMetrics
        }
        break;

      case 'health_update':
        if (message.bot_id) {
          // Invalidate health and bot detail queries
          queryClient.invalidateQueries({ queryKey: ['bot', message.bot_id, 'health'] });
          queryClient.invalidateQueries({ queryKey: ['bot', message.bot_id] });
          // Only invalidate bots list for health changes (state visible in grid)
          queryClient.invalidateQueries({ queryKey: ['bots'] });
        }
        break;

      case 'trade_update':
        if (message.bot_id) {
          // Invalidate trades and metrics (trade affects profit)
          queryClient.invalidateQueries({ queryKey: ['bot', message.bot_id, 'trades'] });
          queryClient.invalidateQueries({ queryKey: ['bot', message.bot_id, 'trades', 'sparkline'] });
          queryClient.invalidateQueries({ queryKey: ['bot', message.bot_id, 'metrics'] });
        }
        break;

      case 'portfolio_update':
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        break;

      case 'bot_discovered':
      case 'bot_removed':
        queryClient.invalidateQueries({ queryKey: ['bots'] });
        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
        break;

      case 'subscribed':
      case 'unsubscribed':
      case 'pong':
        // Acknowledgment messages, no action needed
        break;

      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }, [queryClient]);

  const subscribe = useCallback((newChannel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'subscribe',
        channel: newChannel,
      }));
    }
  }, []);

  const unsubscribe = useCallback((oldChannel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'unsubscribe',
        channel: oldChannel,
      }));
    }
  }, []);

  const ping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'ping' }));
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    // Small delay to avoid rapid connect/disconnect in React StrictMode
    const connectTimeout = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(connectTimeout);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null; // Clear ref first to prevent callbacks
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);

  // Keep-alive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      ping();
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, ping]);

  return {
    isConnected,
    connectionError,
    lastMessage,
    subscribe,
    unsubscribe,
    ping,
  };
}

/**
 * Hook specifically for bot detail page - subscribes to bot-specific channel.
 */
export function useBotWebSocket(botId: string) {
  return useWebSocket({
    channel: `bot:${botId}`,
    enabled: Boolean(botId),
  });
}
