import { useEffect, useRef } from "react";
import { useMetricsStore } from "../store";
import { WSMessage } from "../types/schema";

export function useMetricsSocket(url: string) {
  const processMessage = useMetricsStore((s) => s.processMessage);
  const setIsInitialLoad = useMetricsStore((s) => s.setIsInitialLoad);
  const setConnected = useMetricsStore((s) => s.setConnected);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        setConnected(true);
        // Reset initial load flag on new connection
        setIsInitialLoad(true);
      };
      socket.onclose = () => setConnected(false);

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "history") {
            console.log(
              `Received batched history with ${parsed.messages.length} messages`
            );
            // Process all messages at once
            parsed.messages.forEach((msg: string) => processMessage(msg));
            // Mark initial load as complete
            setIsInitialLoad(false);
          } else {
            const result = WSMessage.safeParse(parsed);
            if (!result.success) {
              console.warn("Unknown message format:", result.error);
              return;
            }
            processMessage(result.data);
          }
        } catch (err) {
          console.error("Parse error:", err);
        }
      };
    };
    connect();
    return () => ws.current?.close();
  }, [url, processMessage, setConnected, setIsInitialLoad]);
}
