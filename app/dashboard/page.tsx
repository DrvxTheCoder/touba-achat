"use client"

import Link from "next/link"
import { Metadata } from "next"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowUpRight, CheckCircle2Icon, Clock, CreditCard, DollarSign, LuggageIcon, Package2Icon, PackageIcon, Users, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDateRangePicker } from "@/app/dashboard/components/date-range-picker";
import { MainNav } from "@/app/dashboard/components/main-nav";
import { Overview } from "@/app/dashboard/components/overview";
import { RecentSales } from "@/app/dashboard/components/recent-sales";
import TeamSwitcher from "@/app/dashboard/components/team-switcher";
import { UserNav } from "@/app/dashboard/components/user-nav";
import { CardsActivityGoal } from "@/app/dashboard/components/cards/activity";
import { CardsMetric2 } from "@/app/dashboard/components/cards/metrics-2";
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { MailList } from "@/app/dashboard/components/mail-list"
import { accounts, mails } from "@/app/dashboard/components/data"

export default function Dashboard (){
  const [badgeCount, setBadgeCount] = useState(1);

  useEffect(() => {
    const filtered = mails.filter((item) => !item.read);
    setBadgeCount(filtered.length);
  }, [mails]);
  
    return(
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-lg md:text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
            <TeamSwitcher />
            </div>
          </div>
          <Tabs defaultValue="edb" className="space-y-4 flex flex-col items-center sm:max-w-90">
            <TabsList className="max-w-md">
              <TabsTrigger value="edb">EDB</TabsTrigger>
              <TabsTrigger value="odm">ODM</TabsTrigger>
              <TabsTrigger value="analytics">Analytiques</TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications
                {badgeCount > 0 && (
                    <Badge className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                       {badgeCount} 
                    </Badge>)}
              </TabsTrigger>
            </TabsList>
            {/* Start Etats de besoins */}
            <TabsContent value="edb" className="space-y-4 w-full">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Dépenses Totale
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">XOF 8910222</div>
                    <p className="text-xs text-muted-foreground">
                      +20.1% sur le mois passé
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      États de Besoins
                    </CardTitle>
                    <PackageIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">60</div>
                    <p className="text-xs text-muted-foreground">
                      +18.1% sur le mois dernier
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Actif
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+30</div>
                    <p className="text-xs text-muted-foreground">
                    +5 depuis la dernière heure
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">25</div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <Overview />
                  </CardContent>
                </Card>
                <CardsMetric2 />
              </div>
            </TabsContent>
            {/* End Etat de besoins */}
            {/* Start Ordres de Missions */}
            <TabsContent value="odm" className="space-y-4 w-full">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Émis
                    </CardTitle>
                    <LuggageIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">15</div>
                    <p className="text-xs text-muted-foreground">
                      -10.5% sur le mois passé
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Demandes Approuvées
                    </CardTitle>
                    <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
                    
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    {/* <p className="text-xs text-muted-foreground">
                      +18.1% sur le mois dernier
                    </p> */}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Actif
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+30</div>
                    <p className="text-xs text-muted-foreground">
                    +5 depuis la dernière heure
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">25</div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <Overview />
                  </CardContent>
                </Card>
                <CardsMetric2 />
              </div>
            </TabsContent>
            {/* End Ordres de Missions */}
            
            {/* Start Analytiques */}
            <TabsContent value="analytics" className="space-y-4 w-full">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Vue d&apos;ensemble</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <Overview />
                  </CardContent>
                </Card>
                <CardsMetric2 />
              </div>
            </TabsContent>
            {/* End Analytiques */}
            <TabsContent value="notifications">
            <MailList items={mails.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    );
}