"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useEffect, useState } from "react"

type FrequencyData = {
  month: string
  stockEdb: number
  standardEdb: number
  odm: number
}

const chartConfig = {
  stockEdb: {
    label: "EDBs (Stock)",
    color: "hsl(var(--chart-1))",
  },
  standardEdb: {
    label: "EDBs (Standard)",
    color: "hsl(var(--chart-2))",
  },
  odm: {
    label: "ODMs",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function AreaChartCard() {
  const [data, setData] = useState<FrequencyData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFrequencyData = async () => {
      try {
        const response = await fetch('/api/dashboard/frequency')
        if (!response.ok) throw new Error('Failed to fetch frequency data')
        const frequencyData = await response.json()
        setData(frequencyData)
      } catch (error) {
        console.error('Error fetching frequency data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFrequencyData()
  }, [])

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Fréquence EDB/ODM</CardTitle>
          <CardDescription className="text-xs">
            Vos états de besoins et ordres de mission sur les 6 dernier mois
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-full h-40 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Fréquence EDB/ODM</CardTitle>
        <CardDescription className="text-xs">
          Vos états de besoins et ordres de mission sur les 6 dernier mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartContainer config={chartConfig}>
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">
                                {payload[0].payload.month}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {payload.map((entry: any) => (
                                <div
                                  key={entry.name}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span className="flex items-center gap-2 text-sm">
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{
                                        backgroundColor: entry.color,
                                      }}
                                    />
                                    <span>{chartConfig[entry.name as keyof typeof chartConfig].label}</span>
                                  </span>
                                  <span className="text-sm font-medium">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="stockEdb"
                  stackId="1"
                  stroke={chartConfig.stockEdb.color}
                  fill={chartConfig.stockEdb.color}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="standardEdb"
                  stackId="1"
                  stroke={chartConfig.standardEdb.color}
                  fill={chartConfig.standardEdb.color}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="odm"
                  stackId="1"
                  stroke={chartConfig.odm.color}
                  fill={chartConfig.odm.color}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}