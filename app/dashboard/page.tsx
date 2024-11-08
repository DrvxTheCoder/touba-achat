"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OpenInNewWindowIcon } from "@radix-ui/react-icons"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/app/dashboard/components/overview"
import { CardsMetric2 } from "@/app/dashboard/components/cards/metrics-2"
import { MailList } from "@/app/dashboard/components/mail-list"
import OverviewChart from "@/app/dashboard/components/overview-two"
import { mails } from "@/app/dashboard/components/data"
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { EDBChartCard } from "./components/cards/EDBChartCard"
import { EDBDashboardCards } from "./components/EDBDashboardCards"
import { ContentLayout } from "@/components/user-panel/content-layout"
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs"
import { LayoutGrid } from "lucide-react"

export default function Dashboard() {
  const [badgeCount, setBadgeCount] = useState(1)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const filtered = mails.filter((item) => !item.read)
    setBadgeCount(filtered.length)
  }, [])

  return (
    <ContentLayout title="Dashboard">
      <DynamicBreadcrumbs />
      <main className="flex flex-1 flex-col gap-4 p-1 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-center rounded-lg h-[42rem] border border-dashed">
          <div className="flex flex-col items-center gap-4 text-center">
            <LayoutGrid className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">
              Dashboard
            </h3>
            <p className="text-sm text-muted-foreground">
              Le tableau de bord sera bientot disponible, nous travaillons sur des mises à jour.
            </p>
            <Button className="mt-2" variant="default" asChild>
              <Link href="/acceuil">Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </div>
      </main>
    </ContentLayout>
  )
}