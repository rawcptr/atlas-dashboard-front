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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMetricsStore } from "@/store";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

export const ChartColors = {
  loss: "#b05730",
  mean: "#ded8c4",
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
  xFormatter?: (n: number) => string;
  yFormatter?: (n: number) => string;
}

const GenericChartComponent = ({
  title,
  metric,
  xlabel,
  chartData,
  chartConfig,
  chartStyle,
  area = true,
  precision = 3,
  xFormatter = (n: number) => String(n),
  yFormatter = (n: number) => n.toFixed(3),
}: GenericChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [axis, setAxis] = useState(0);

  const { min, max, padding } = useMemo(() => {
    const vals = chartData.map((d) => d.value as number);
    const mn = vals.length > 0 ? Math.min(...vals) : 0;
    const mx = vals.length > 0 ? Math.max(...vals) : 0;
    const pad = Number(((mx - mn) * 0.2).toFixed(precision));
    return { min: mn, max: mx, padding: pad };
  }, [chartData, precision]);

  const springX = useSpring(0, {
    stiffness: 190,
    damping: 30,
  });

  const springY = useSpring(0, {
    stiffness: 190,
    damping: 30,
  });

  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const reducedMotion = useMetricsStore(s => s.reducedMotion);
  const prevLengthRef = useRef(chartData.length);

  useEffect(() => {
    const isBatch = Math.abs(chartData.length - prevLengthRef.current) > 10;
    prevLengthRef.current = chartData.length;
    if (chartData.length > 0) {
      const lastDataPoint = chartData[chartData.length - 1] ?? 0;
      const width = chartRef.current?.getBoundingClientRect().width || 0;
      const shouldJump = reducedMotion || isBatch;
      if (shouldJump) {
        springX.jump(width);
        springY.jump(lastDataPoint.value as number);
      } else {
        springX.set(width);
        springY.set(lastDataPoint.value as number);
      }
      setActiveLabel(String(lastDataPoint.step));
      setAxis(width);
    }
  }, [chartData, springX, springY, reducedMotion]);

  useMotionValueEvent(springX, "change", (latest) => {
    setAxis(latest);
  });

  return (
    <Card>
      <CardHeader className="text-left">
        <CardTitle className="font-normal">
          {yFormatter(Number(springY.get()))} {"\u{2022}"} {xlabel}:{" "}
          {xFormatter(Number(activeLabel)) ?? "-"}
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
              if (reducedMotion) {
                springX.jump(width);
                springY.jump(
                  chartData.length > 0 ? chartData[chartData.length - 1].value : 0
                );
              } else {
                springX.set(width);
                springY.set(
                  chartData.length > 0 ? chartData[chartData.length - 1].value : 0
                );
              }
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
              tickFormatter={(tick: number) => xFormatter(tick)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              domain={[min, max + padding]}
              tickFormatter={(tick: number) => tick.toFixed(precision)}
            />
            {area && (
              <Area
                dataKey="value"
                type="monotone"
                fill={`url(#gradient-cliped-area-${metric})`}
                fillOpacity={0.9}
                stroke={`var(--color-${metric})`}
                clipPath={`inset(0 ${Math.max(
                  (chartRef.current?.getBoundingClientRect().width ?? 0) - axis,
                  0
                )} 0 0)`}
              />
            )}

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
              {yFormatter(springY.get())}
            </text>

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
};

export const GenericChart = React.memo(GenericChartComponent);
