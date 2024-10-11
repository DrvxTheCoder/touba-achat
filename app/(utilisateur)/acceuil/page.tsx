"use client"
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Ban,
  Bell,
  CircleUser,
  Clock,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EDB } from "../etats-de-besoin/data/types";
import { EDBTableRow } from "../etats-de-besoin/components/EDBTableRow";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { ContentLayout } from "@/components/user-panel/content-layout"
import { accounts, mails } from "@/app/dashboard/components/data"
import { MailList } from "@/app/dashboard/components/mail-list"
import { Notifications } from "./components/Notifications"
import { SpinnerCircular } from "spinners-react";


export default function Dashboard() {
    const { data: session } = useSession();
    const [edbs, setEdbs] = useState<EDB[]>([]);
    const [selectedEDB, setSelectedEDB] = useState<EDB | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    
  
    useEffect(() => {
      const fetchEDBs = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/edb/user?page=${page}&pageSize=${pageSize}&search=${searchTerm}&status=${statusFilter}`);
          if (!response.ok) {
            throw new Error('Erreur réseau lors de la récupération des EDBs');
          }
          const data = await response.json();
          setEdbs(data.data);
          setTotal(data.total);
        } catch (error) {
          console.error("Erreur lors de la récupération des EDPs:", error);
          // You can add a user notification here
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchEDBs();
    }, [page, pageSize, searchTerm, statusFilter]);
    const getFirstName = (fullName: string): string => {
        const nameParts = fullName.trim().split(' ');
        return nameParts[0];
      };
  return (
    <ContentLayout title="Accueil">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>Accueil</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
      </BreadcrumbList>
    </Breadcrumb>

    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="sm:col-span-2">
        <CardHeader className="pb-3">
            <CardTitle>Salut, {session?.user?.name ? getFirstName(session.user.name) : 'Utilisateur'} 👋</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
                Bienvenu sur l&apos;application <text className="text-primary">ToubaApp</text>. Cliquez sur le button ci-dessous pour émettre un état de besoin.
            </CardDescription>
        </CardHeader>
        <CardFooter>
            <Link href="/etats-de-besoin/nouveau"><Button>Nouvel état de besoin</Button></Link>
        </CardFooter>
        </Card>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Actif</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">1</div>
        </CardContent>
        <CardFooter>
        <p className="text-xs text-muted-foreground">
            EDB(s) en cours de traitement
          </p>
        </CardFooter>
        </Card>
    </div>
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mb-8">
    <Card className="sm:col-span-2">
            <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Récents</CardTitle>
                <CardDescription>
                Vos états de besoins les plus recent.
                </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1" variant="outline">
                <Link href="/etats-de-besoin">
                Voir tout
                <ArrowUpRight className="h-4 w-4" />
                </Link>
            </Button>
            </CardHeader>
            <CardContent>
            <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="rounded-lg border-0">
                    <TableHead className="rounded-l-lg">
                      ID
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">Titre</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Catégorie
                    </TableHead>
                    <TableHead className="rounded-r-lg md:rounded-none text-right md:text-left">
                      Statut
                    </TableHead>
                    <TableHead className="hidden sm:table-cell text-right rounded-r-lg">
                      Montant (XOF)
                    </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex justify-center items-center h-24">
                          {/* <RefreshCwIcon className="h-6 w-6 animate-spin" /> */}
                          <SpinnerCircular size={40} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                        </div>
                        </TableCell>
                      </TableRow>
                    ) : edbs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Aucun état de besoin trouvé.</TableCell>
                      </TableRow>
                    ) : (
                      edbs.map((edb) => (
                        <EDBTableRow key={edb.id} edb={edb} onClick={() => setSelectedEDB(edb)} isSelected={selectedEDB?.id === edb.id} />
                      ))
                    )}
                  </TableBody>
                </Table>
            </CardContent>
        </Card>

    </div>
  </main>
    </ContentLayout>

  )
}

