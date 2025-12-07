import { useEffect, useRef } from "react";
import { useMetricsStore } from "../store";
import { WSMessage } from "../types/schema";

export function useMetricsSocket(url: string) {
    const processMessage = useMetricsStore((s) => s.processMessage);
    const setConnected = useMetricsStore((s) => s.setConnected);

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            const socket = new WebSocket(url);
            ws.current = socket;

            socket.onopen = () => setConnected(true);
            socket.onclose = () => setConnected(false);

            socket.onmessage = (event) => {
                try {
                    const json = JSON.parse(event.data);
                    const result = WSMessage.safeParse(json);
                    if (!result.success) {
                        console.warn("Unknown message format:", result.error);
                        return;
                    }
                    processMessage(result.data);
                } catch (err) {
                    console.error("Parse error:", err);
                }
            };
        };
        connect();
        return () => ws.current?.close();
    }, [url, processMessage, setConnected]);
}
