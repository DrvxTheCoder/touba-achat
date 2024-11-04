"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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

export const description = "A stacked area chart"

const chartData = [
  { month: "Janvier", edb: 2, odm: 1 },
  { month: "Fevrier", edb: 3, odm: 0 },
  { month: "Mars", edb: 1, odm: 0 },
  { month: "Avril", edb: 0, odm: 1 },
  { month: "Mai", edb: 5, odm: 2 },
  { month: "Juin", edb: 1, odm: 1 },
]

const chartConfig = {
  edb: {
    label: "EDBs",
    color: "hsl(var(--chart-1))",
  },
  odm: {
    label: "ODMs",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function AreaChartCard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Fréquence EDB/ODM</CardTitle>
        <CardDescription className="text-xs">
          Vos états de besoins et ordres de mission sur les 6 dernier mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="odm"
              type="natural"
              fill="var(--color-odm)"
              fillOpacity={0.4}
              stroke="var(--color-odm)"
              stackId="a"
            />
            <Area
              dataKey="edb"
              type="natural"
              fill="var(--color-edb)"
              fillOpacity={0.4}
              stroke="var(--color-edb)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              January - June 2024
            </div>
          </div>
        </div>
      </CardFooter> */}
    </Card>
  )
}
