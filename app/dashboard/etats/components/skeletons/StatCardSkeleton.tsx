import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-40 rounded-sm" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12 mb-2 rounded-sm" />
        <Skeleton className="h-3 w-32 rounded-sm" />
      </CardContent>
    </Card>
  )
}