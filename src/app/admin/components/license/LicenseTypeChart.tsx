"use client"

import * as React from "react"
import { BarChart2 } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { LICENSE_TYPES } from "./LicenseTypes"

interface LicenseStatsProps {
  MiningLease: number;
  Prospecting: number;
  Reconnaissance: number;
  smallScale: number;
  total: number;
}

export function LicenseTypeChart({ stats }: { stats: LicenseStatsProps }) {
  const chartData = React.useMemo(() => [
    { 
      type: "mining-lease", 
      count: stats.MiningLease, 
      fill: "#2563eb" // bg-blue-600
    },
    { 
      type: "prospecting", 
      count: stats.Prospecting, 
      fill: "#6366f1" // bg-indigo-500
    },
    { 
      type: "reconnaissance", 
      count: stats.Reconnaissance, 
      fill: "#a855f7" // bg-purple-500
    },
    { 
      type: "small-scale", 
      count: stats.smallScale, 
      fill: "#22c55e" // bg-green-500
    },
  ], [stats]);

  const chartConfig = {
    count: {
      label: "Licenses",
    },
    "mining-lease": {
      label: LICENSE_TYPES.MINING_LEASE,
      color: "#2563eb", // bg-blue-600
    },
    "prospecting": {
      label: LICENSE_TYPES.PROSPECTING,
      color: "#6366f1", // bg-indigo-500
    },
    "reconnaissance": {
      label: LICENSE_TYPES.RECONNAISSANCE,
      color: "#a855f7", // bg-purple-500
    },
    "small-scale": {
      label: LICENSE_TYPES.SMALL_SCALE,
      color: "#22c55e", // bg-green-500
    },
  } satisfies ChartConfig;

  // Calculate percentages for the description
  const getMostCommonType = () => {
    const types = [
      { type: LICENSE_TYPES.MINING_LEASE, count: stats.MiningLease },
      { type: LICENSE_TYPES.PROSPECTING, count: stats.Prospecting },
      { type: LICENSE_TYPES.RECONNAISSANCE, count: stats.Reconnaissance },
      { type: LICENSE_TYPES.SMALL_SCALE, count: stats.smallScale }
    ];
    
    return types.sort((a, b) => b.count - a.count)[0];
  };

  const mostCommon = getMostCommonType();
  const mostCommonPercentage = stats.total > 0 
    ? Math.round((mostCommon.count / stats.total) * 100) 
    : 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-start pb-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle className="text-md font-medium text-gray-700">License Types</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Distribution of mining licenses by type
            </CardDescription>
          </div>
          <BarChart2 className="h-5 w-5 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {stats.total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Licenses
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-0 pb-4 px-6">
        <div className="text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
              <span>{LICENSE_TYPES.MINING_LEASE}: {stats.MiningLease}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
              <span>{LICENSE_TYPES.PROSPECTING}: {stats.Prospecting}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
              <span>{LICENSE_TYPES.RECONNAISSANCE}: {stats.Reconnaissance}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              <span>{LICENSE_TYPES.SMALL_SCALE}: {stats.smallScale}</span>
            </div>
          </div>
          {stats.total > 0 && (
            <p className="mt-3 text-center">
              {mostCommon.type} is the most common license type ({mostCommonPercentage}% of total)
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 