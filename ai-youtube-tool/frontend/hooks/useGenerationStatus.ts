/**
 * WebSocket hook for real-time generation status updates.
 *
 * Falls back to polling if WebSocket connection fails.
 * Reconnects automatically with exponential backoff.
 */

import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  .replace(/^http/, "ws") + "/ws/generations";

const RECONNECT_BASE_DELAY = 2000;
const RECONNECT_MAX_DELAY = 30000;
const PING_INTERVAL = 30000;

export interface GenerationUpdate {
  type: "generation_update";
  asset_id: string;
  generation_id: string;
  status: string;
  asset_type?: string;
  error?: string;
}

type StatusCallback = (update: GenerationUpdate) => void;

export function useGenerationStatus(onUpdate: StatusCallback) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  const connect = useCallback(() => {
    // Cleanup existing
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempt.current = 0;

        // Start ping keepalive
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "generation_update") {
            callbackRef.current(data as GenerationUpdate);
          }
        } catch {
          // Ignore non-JSON (pong, etc.)
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (pingTimer.current) clearInterval(pingTimer.current);

        // Reconnect with exponential backoff
        const delay = Math.min(
          RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempt.current),
          RECONNECT_MAX_DELAY
        );
        reconnectAttempt.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not supported or URL invalid
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
    };
  }, [connect]);

  return { connected };
}
