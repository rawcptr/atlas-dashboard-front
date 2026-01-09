import { useThrottle } from "@/hooks/useThrottle";
import { useMetricsStore } from "@/store";
import type { GpuStats } from "@/types/schema";
import React from "react";
import { ChartColors, GenericChart } from "./singleAreaChart";
import type { ChartConfig } from "./ui/chart";

interface ComputeMetricChartProps {
  gpuId: number;
  metric: keyof Pick<GpuStats, "gpu_util" | "pwr_draw" | "mem_usg" | "temp">;
  title: string;
  xFmt?: (n: number) => string;
  yFmt?: (n: number) => string;
  color?: string;
  style?: string;
  area?: boolean;
  className?: string;
  xlabel?: string;
  precision?: number;
}

function ComputeChartComponent({
  gpuId,
  metric,
  title,
  color = ChartColors.attn_entropy,
  area = true,
  style = "flex-1",
  className = "",
  xlabel = "timestamp",
  xFmt = (n: number) => String(n),
  yFmt = (n: number) => String(n),
  precision = 3,
}: ComputeMetricChartProps) {
  const data = useMetricsStore((s) => s.gpu[gpuId]?.[metric] ?? {});
  const throttledData = useThrottle(data, 1000);
  if (!throttledData || throttledData.length === 0) return null;
  const config = {
    [metric]: { label: metric, color: color },
  } satisfies ChartConfig;
  return (
    <div className={className}>
      <GenericChart
        title={title}
        metric={metric}
        xlabel={xlabel}
        chartData={throttledData}
        chartConfig={config}
        area={area}
        chartStyle={style}
        xFormatter={xFmt}
        yFormatter={yFmt}
        precision={precision}
      ></GenericChart>
    </div>
  );
}

export const ComputeChart = React.memo(ComputeChartComponent);
