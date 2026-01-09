import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMetricsStore } from "@/store";
import { useState } from "react";
import { ComputeChart } from "./computeChart";

function formatTimestamp(ts: number) {
  if (!ts) return "-";
  const date = new Date(ts * 1000);
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Compute() {
  const gpuRecord = useMetricsStore((s) => s.gpu);
  const gpuIds = Object.keys(gpuRecord)
    .map(Number)
    .sort((a, b) => a - b);
  const [selectedGpu, setSelectedGpu] = useState(gpuIds[0] ?? 0);

  // if (gpuIds.length === 0) {
  //   return <div>No GPU data available</div>;
  // }

  return (
    <div className="flex flex-col gap-2.5">
      <Select
        value={String(selectedGpu)}
        onValueChange={(v) => setSelectedGpu(Number(v))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select GPU" />
        </SelectTrigger>
        <SelectContent>
          {gpuIds.map((id) => (
            <SelectItem key={id} value={String(id)}>
              GPU {id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-col gap-2.5 flex-1">
        <ComputeChart
          gpuId={selectedGpu}
          metric="mem_usg"
          title="Memory Usage"
          yFmt={(n: number): string => `${n.toFixed(0)}MiB`}
          xFmt={formatTimestamp}
          precision={0}
          style="w-full h-64"
        />
        <ComputeChart
          gpuId={selectedGpu}
          metric="gpu_util"
          title="GPU Utilization"
          yFmt={(n: number): string => `${n.toFixed(1)}%`}
          xFmt={formatTimestamp}
          precision={1}
          style="w-full h-64"
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <ComputeChart
          gpuId={selectedGpu}
          metric="temp"
          title="Temperature"
          yFmt={(n: number): string => `${n.toFixed(1)}°C`}
          xFmt={formatTimestamp}
          precision={1}
        />
        <ComputeChart
          gpuId={selectedGpu}
          metric="pwr_draw"
          title="Power Draw"
          yFmt={(n: number): string => `${n.toFixed(1)}W`}
          xFmt={formatTimestamp}
          precision={1}
        />
      </div>
    </div>
  );
}
