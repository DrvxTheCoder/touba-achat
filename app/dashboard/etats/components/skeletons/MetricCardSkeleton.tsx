import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function MetricCardSkeleton() {
  return (
    <Card className="flex flex-col lg:max-w-md">
      <CardContent className="flex flex-1 items-center">
        <Skeleton className="h-auto w-full" />
      </CardContent>
    </Card>
  )
}