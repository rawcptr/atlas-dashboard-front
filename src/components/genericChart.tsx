"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { DataPoint } from "@/lib/utils";
import { useMotionValueEvent, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export const ChartColor3 = "#ded8c4";

export const ChartColors = {
  loss: "#b05730",
  mean: "#dbd3f0",
  dev: "#9c87f5",
  max: "#cb997e",
  grad_norm: "#b4552d",
  attn_entropy: "#7a6c5d",
} as const;

export interface GenericChartProps {
  title: string;
  metric: string;
  xlabel: string;
  chartData: DataPoint[];
  chartConfig: ChartConfig;
  chartStyle?: string | null | undefined;
  area?: boolean | null | undefined;
  precision?: number;
}

export function GenericChart({
  title,
  metric,
  xlabel,
  chartData,
  chartConfig,
  chartStyle,
  area = true,
  precision = 3,
}: GenericChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [axis, setAxis] = useState(0);

  const values = chartData.map((d) => d.value as number);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const padding = Number(((max - min) * 0.2).toFixed(precision));

  const springX = useSpring(0, {
    stiffness: 190,
    damping: 30,
  });

  const springY = useSpring(0, {
    stiffness: 190,
    damping: 30,
  });

  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    if (chartData.length > 0) {
      const lastDataPoint = chartData[chartData.length - 1] ?? 0;
      const width = chartRef.current?.getBoundingClientRect().width || 0;
      springX.jump(width);
      springY.jump(lastDataPoint.value as number);
      setActiveLabel(String(lastDataPoint.step));
      setAxis(width);
    }
  }, [chartData, springX, springY]);

  useMotionValueEvent(springX, "change", (latest) => {
    setAxis(latest);
  });

  return (
    <Card>
      <CardHeader className="text-left">
        <CardTitle className="font-normal">
          {Number(springY.get()).toFixed(precision)} {"\u{2022}"} {xlabel}:{" "}
          {activeLabel ?? "-"}
        </CardTitle>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="">
        <ChartContainer
          ref={chartRef}
          className={`${chartStyle}`}
          config={chartConfig}
        >
          <AreaChart
            syncMethod={"value"}
            className="overflow-visible"
            accessibilityLayer
            data={chartData}
            onMouseMove={(state) => {
              const x = state.activeCoordinate?.x;
              const dataValue = state.activePayload?.[0]?.value;
              const step = state.activeLabel;

              if (step !== undefined) setActiveLabel(String(step));
              if (x && dataValue !== undefined) {
                springX.set(x);
                springY.set(dataValue);
              }
            }}
            onMouseLeave={() => {
              const width =
                chartRef.current?.getBoundingClientRect().width || 0;
              springX.set(width);
              springY.jump(
                chartData.length > 0 ? chartData[chartData.length - 1].value : 0
              );
              setActiveLabel(
                String(
                  chartData.length > 0
                    ? chartData[chartData.length - 1].step
                    : 0
                )
              );
            }}
            margin={{
              right: 0,
              left: 0,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              horizontalCoordinatesGenerator={(props) => {
                const { height } = props;
                return [0, height - 30];
              }}
            />
            <XAxis
              dataKey={"step"}
              tickLine={false}
              axisLine={false}
              tick={true}
              tickMargin={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              domain={[min - padding * 0.5, max + padding]}
              tickFormatter={(tick: number) =>
                String(tick.toFixed(precision) || tick)
              }
            />
            {area && (
              <Area
                dataKey="value"
                type="monotone"
                fill={`url(#gradient-cliped-area-${metric})`}
                fillOpacity={0.9}
                stroke={`var(--color-${metric})`}
                clipPath={`inset(0 ${Math.max(
                  // eslint-disable-next-line react-hooks/refs
                  (chartRef.current?.getBoundingClientRect().width ?? 0) - axis,
                  0
                )} 0 0)`}
              />
            )}
            {chartData.length !== 0 && (
              <>
                <line
                  x1={axis}
                  y1={0}
                  x2={axis}
                  y2={"85%"}
                  stroke={`var(--color-${metric})`}
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  strokeOpacity={activeLabel === null ? 0 : 0.3}
                />
                <rect
                  x={axis - 50}
                  y={0}
                  width={50}
                  height={18}
                  fill={`var(--color-${metric})`}
                />
                <text
                  x={axis - 25}
                  y={13}
                  textAnchor="middle"
                  fill="var(--primary-foreground)"
                >
                  {Number(springY.get()).toFixed(precision)}
                </text>
              </>
            )}

            <Area
              dataKey="value"
              type="monotone"
              fill="none"
              stroke={`var(--color-${metric})`}
              strokeOpacity={area ? 0.2 : 1.0}
              strokeWidth={!area ? 1.75 : undefined}
            />
            <defs>
              <linearGradient
                id={`gradient-cliped-area-${metric}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="50%"
                  stopColor={`var(--color-${metric})`}
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={`var(--color-${metric})`}
                  stopOpacity={0}
                />
                <mask id={`mask-cliped-area-chart-${metric}`}>
                  <rect
                    x={0}
                    y={0}
                    width={"50%"}
                    height={"100%"}
                    fill="white"
                  />
                </mask>
              </linearGradient>
            </defs>
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-muted-foreground text-[13px]">
        min: {min.toFixed(precision)} {"\u{2022}"} max: {max.toFixed(precision)}
      </CardFooter>
    </Card>
  );
}
