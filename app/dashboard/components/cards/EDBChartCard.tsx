"use client"
import { useState, useEffect } from "react"
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

interface ChartDataPoint {
    month: string;
    count: number;
  }

export const description = "A simple area chart"



export function EDBChartCard() {
const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard/monthly-data?entity=edb');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      const result = await response.json();
      setChartData(result);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  fetchData();
}, []);
// const chartData = [
//     { month: "Janvier", edbs: 186 },
//     { month: "Février", edbs: 305 },
//     { month: "Mars", edbs: 237 },
//     { month: "Avril", edbs: 73 },
//     { month: "Mai", edbs: 209 },
//     { month: "Juin", edbs: 214 },
//   ]

const chartConfig = {
  desktop: {
    label: "EDBs: ",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig
  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle>Fréquence</CardTitle>
        <CardDescription>
          Fréquence mensuel des EDBs
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
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="edbs"
              type="natural"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              +5.2% sur le mois dernier <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
