import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import {
  greenArrowDown,
  greenArrowUp,
  redArrowDown,
  redArrowUp,
} from "./icons";

export interface MetricCardProp {
  title: string;
  desc: string | undefined;
  value: string;
  delta: number | undefined;
  lowerBetter: boolean;
}

function handleDelta(delta: number, lowerBetter: boolean) {
  const isPositiveDelta = delta >= 0;
  const positiveIsBetter = !lowerBetter;

  if (positiveIsBetter) {
    return isPositiveDelta ? greenArrowUp : redArrowDown;
  } else {
    return isPositiveDelta ? redArrowUp : greenArrowDown;
  }
}

export function MetricCard({
  title,
  desc,
  value,
  delta,
  lowerBetter,
}: MetricCardProp) {
  return (
    <Card className="p-6 h-full justify-evenly">
      <div className="flex items-center justify-between">
        <CardTitle className="p-0 whitespace-nowrap text-[17px] font-normal">
          {title}
        </CardTitle>
        <div className="flex flex-row items-center gap-1">
          {delta && (
            <Badge variant="outline" className="h-min pr-3 pl-1 rounded-md">
              <div className="w-6 h-6">{handleDelta(delta, lowerBetter)}</div>
              <span className="font-normal">{Math.abs(delta)}%</span>
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-0 text-left text-5xl">{value}</CardContent>
      {desc && (
        <CardDescription className="text-left p-0 mt-2">{desc}</CardDescription>
      )}
    </Card>
  );
}
