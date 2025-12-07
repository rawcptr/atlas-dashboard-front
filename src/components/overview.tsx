import { GpuCard } from "./gpuTable";

import { computeComparatorStatistics } from "@/lib/utils";
// import { LossChart } from "../charts/global";
import type { ChartConfig } from "@/components/ui/chart";
import { useMetricsStore } from "@/store";
import { ChartColors, GenericChart } from "./genericChart";
import { MetricCard, type MetricCardProp } from "./metrics";

function tokensPerSecond(tokens: number | undefined | null) {
  if (!tokens) {
    return "0/s";
  }
  if (tokens < 1000) {
    return tokens.toFixed(0) + "/s";
  }
  const tokensInK = tokens / 1000;
  return tokensInK.toFixed(1) + "k/s";
}

function MetricRow() {
  const lossHistory = useMetricsStore((s) => s.global.loss);
  const mfuHistory = useMetricsStore((s) => s.global.mfu);
  const throughputHistory = useMetricsStore((s) => s.global.throughput);

  const loss =
    lossHistory.length > 0
      ? computeComparatorStatistics(lossHistory)
      : {
          curr: "N/A",
          stability: "unknown",
          trend: "N/A",
          delta: undefined,
        };
  const throughput =
    throughputHistory.length > 0
      ? computeComparatorStatistics(throughputHistory)
      : {
          curr: "0",
          stability: "unknown",
          trend: "N/A",
          delta: undefined,
        };
  const mfu =
    mfuHistory.length > 0
      ? computeComparatorStatistics(mfuHistory)
      : {
          curr: "0",
          stability: "unknown",
          trend: "N/A",
          delta: undefined,
        };

  const metricsData: MetricCardProp[] = [
    {
      title: "training loss",
      desc: `${loss.stability} \u{2022} ${loss.trend}`,
      value: `${loss.curr}`,
      delta: loss.delta,
      lowerBetter: true,
    },
    {
      title: "MFU",
      desc: `model FLOPS util. \u{2022} ${mfu.trend}`,
      value: `${mfu.curr}%`,
      delta: mfu.delta,
      lowerBetter: false,
    },
    {
      title: "throughput",
      desc: `samples/s \u{2022} ${mfu.trend}`,
      value: tokensPerSecond(Number(throughput.curr)),
      delta: throughput.delta,
      lowerBetter: false,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2.5 justify-between">
      {metricsData.map((card) => (
        <div className="flex-1 basis-1/5 min-w-70" key={card.title}>
          <MetricCard {...card} />
        </div>
      ))}
    </div>
  );
}

const lossConfig = {
  value: {
    label: "value",
    color: ChartColors.loss,
  },
} satisfies ChartConfig;

export function LossChart() {
  const data = useMetricsStore((s) => s.global.loss);
  if (!data) return <></>;
  return (
    <GenericChart
      title="training progress"
      metric="loss"
      xlabel="step"
      chartData={data}
      chartConfig={lossConfig}
      chartStyle="w-full h-64"
    />
  );
}

export default function Overview() {
  return (
    <div className="flex flex-col gap-2.5">
      <MetricRow />
      <LossChart />
      <GpuCard />
    </div>
  );
}
