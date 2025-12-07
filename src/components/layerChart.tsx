import type { ChartConfig } from "@/components/ui/chart";
import { useMetricsStore } from "@/store";
import type { LayerStats } from "@/types/schema";
import { ChartColors, GenericChart } from "./singleAreaChart";

interface LayerMetricChartProps {
  layerId: number;
  metric: keyof Pick<
    LayerStats,
    "mean" | "stddev" | "absmax" | "grad_norm" | "attn_entropy"
  >;
  title: string;
  color?: string;
  area?: boolean;
  style?: string;
  className?: string;
  xlabel?: string;
}

export function LayerChart({
  layerId,
  metric,
  title,
  area = true,
  color = "",
  style = "flex-1",
  className = "",
  xlabel = "step",
}: LayerMetricChartProps) {
  const data = useMetricsStore((s) => s.layers[layerId]?.[metric] ?? []);
  if (data.length === 0) return null;
  if (color === "") {
    switch (metric) {
      case "mean":
        color = ChartColors.mean;
        break;
      case "absmax":
        color = ChartColors.max;
        break;
      case "attn_entropy":
        color = ChartColors.attn_entropy;
        break;
      case "grad_norm":
        color = ChartColors.grad_norm;
        break;
      case "stddev":
        color = ChartColors.dev;
        break;
      default:
        color = "#DED8C4"; // ??
        break;
    }
  }

  const config = {
    [metric]: { label: metric, color: color },
  } satisfies ChartConfig;

  return (
    <div className={className}>
      <GenericChart
        title={title}
        chartData={data}
        area={area}
        chartConfig={config}
        chartStyle={style}
        metric={metric}
        xlabel={xlabel}
      />
    </div>
  );
}
