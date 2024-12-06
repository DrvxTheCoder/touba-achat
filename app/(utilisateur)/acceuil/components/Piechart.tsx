"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
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

type ActivityData = {
  type: string
  count: number
  fill: string
}

type ActivityMetrics = {
  data: ActivityData[]
  totalActions: number
  percentageChange: number
}

const chartConfig = {
  count: {
    label: "Actions",
  },
} satisfies ChartConfig

export function ActivityPieChart() {
  const [metrics, setMetrics] = React.useState<ActivityMetrics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchActivityMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/activity')
        if (!response.ok) throw new Error('Failed to fetch activity metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Error fetching activity metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivityMetrics()
  }, [])

  const currentDate = new Date()
  const month = currentDate.toLocaleString("fr", { month: "long" })
  const year = currentDate.getFullYear()

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="items-center pb-0">
          <CardTitle>Mon Activité</CardTitle>
          <CardDescription className="capitalize">{`${month} ${year}`}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[250px]">
          <div className="animate-pulse w-32 h-32 rounded-full bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!metrics?.data) return null

  return (
    <Card className="rounded-2xl">
      <CardHeader className="items-center pb-0">
        <CardTitle>Mon Activité</CardTitle>
        <CardDescription className="capitalize">{`${month} ${year}`}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {data.type}
                        </span>
                        <span className="font-bold">
                          {data.count} {data.count > 1 ? 'actions' : 'action'}
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={metrics.data}
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
                          {metrics.totalActions}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Actions
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
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {metrics.percentageChange > 0 ? '+' : ''}{metrics.percentageChange}% sur le mois dernier{' '}
          {metrics.percentageChange >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="text-xs leading-none text-muted-foreground">
          Le cumul mensuel de vos actions sur la plateforme
        </div>
      </CardFooter>
    </Card>
  )
}