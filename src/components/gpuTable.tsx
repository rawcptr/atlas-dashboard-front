import { useMetricsStore } from "@/store";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface GPU {
  gpu: number;
  temp: number;
  perf: string;
  powerDraw: number;
  maxPower: number;
  memoryUsage: number;
  maxMemory: number;
  gpuUtil: number;
}

function getColorClass(percentage: number): string {
  if (percentage >= 80) return "text-(--primary)";
  if (percentage >= 50) return "text-yellow-600";
  return "";
}

function ProgressWithLabel({ current, max }: { current: number; max: number }) {
  const percentage = (current / max) * 100;
  return (
    <div className="flex gap-2 items-center min-w-[140px]">
      <Progress
        className="bg-secondary [&>div]:bg-secondary-foreground"
        value={percentage}
      />
      <span>{percentage.toFixed(1)}%</span>
    </div>
  );
}

function ColoredMetric({
  current,
  max,
  label,
}: {
  current: number;
  max: number;
  label: string;
}) {
  const percentage = (current / max) * 100;
  return <span className={`${getColorClass(percentage)}`}>{label}</span>;
}

export function GpuTable({ gpus }: { gpus: GPU[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">GPU</TableHead>
          <TableHead>Temp.</TableHead>
          <TableHead>Perf. Mode</TableHead>
          <TableHead>Pwr. Draw / Cap</TableHead>
          <TableHead>Memory</TableHead>
          <TableHead className="w-60">Memory Util.</TableHead>
          <TableHead className="w-60">GPU Util.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gpus.map((g) => (
          <TableRow className="text-left" key={g.gpu}>
            <TableCell className="w-2 text-right">{g.gpu}</TableCell>
            <TableCell>
              <ColoredMetric current={g.temp} max={100} label={`${g.temp}°C`} />
            </TableCell>
            <TableCell>{g.perf}</TableCell>
            <TableCell>
              <ColoredMetric
                current={g.powerDraw}
                max={g.maxPower}
                label={`${g.powerDraw}W / ${g.maxPower}W`}
              />
            </TableCell>
            <TableCell>
              {g.memoryUsage}MiB / {g.maxMemory}MiB
            </TableCell>
            <TableCell>
              <ProgressWithLabel current={g.memoryUsage} max={g.maxMemory} />
            </TableCell>
            <TableCell>
              <ProgressWithLabel current={g.gpuUtil} max={100} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function GpuCard() {
  const gpuRecord = useMetricsStore((s) => s.gpu);
  const staticInfo = useMetricsStore((s) => s.staticInfo || {});
  const gpuArray: GPU[] = Object.entries(gpuRecord).map(([id, data]) => ({
    gpu: Number(id),
    temp: data.temp ?? 0,
    perf: data.perf ?? "N/A",
    powerDraw: data.pwr_draw ?? 0,
    maxPower: data.max_pwr ?? 0,
    memoryUsage: data.mem_usg ?? 0,
    maxMemory: data.max_mem ?? 0,
    gpuUtil: data.gpu_util ?? 0,
  }));
  // if (gpuArray.length === 0) return null;
  const gpus = Object.values(gpuArray).sort(
    (a, b) => (a.gpu || 0) - (b.gpu || 0)
  );

  return (
    <Card>
      <CardHeader className="text-left font-normal">GPU Status</CardHeader>
      <CardContent>
        <GpuTable gpus={gpus ?? []} />
      </CardContent>
      <CardFooter className="text-muted-foreground text-[13px]">
        NVIDIA-SMI {staticInfo.smi_ver ?? "N/A"} | Driver Version{" "}
        {staticInfo.driver_ver ?? "N/A"} | CUDA Version{" "}
        {(staticInfo.cuda_ver as string) ?? "N/A"}
      </CardFooter>
    </Card>
  );
}

