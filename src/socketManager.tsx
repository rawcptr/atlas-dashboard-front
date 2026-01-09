import { useMetricsSocket } from "@/hooks/useMetricsSocket";

export function SocketManager({
  domain = "localhost",
  port = 2626,
}: {
  domain: string;
  port?: number;
}) {
  useMetricsSocket(`ws://${domain}:${port}/metrics`);
  return null;
}
