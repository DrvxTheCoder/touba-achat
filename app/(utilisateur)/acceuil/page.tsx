"use client"
import Link from "next/link"
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
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { ContentLayout } from "@/components/user-panel/content-layout"
import { accounts, mails } from "@/app/dashboard/components/data"
import { MailList } from "@/app/dashboard/components/mail-list"
import { Notifications } from "./components/Notifications"


export default function Dashboard() {
    const { data: session } = useSession();
    const getFirstName = (fullName: string): string => {
        const nameParts = fullName.trim().split(' ');
        return nameParts[0];
      };
  return (
    <ContentLayout title="Acceuil">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>Acceuil</BreadcrumbPage>
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
          <div className="text-3xl font-bold">5</div>
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
                      <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-5212377</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        Fournitures de Bureau
                      </TableCell>
                      <TableCell className="text-right md:text-left">
                        <Badge className="text-xs" variant="secondary">
                        <small>Soumis</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">56040</TableCell>
                      </TableRow>
                      <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-5612098</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        Matériel Industriel
                      </TableCell>
                      <TableCell className="text-right md:text-left">
                        <Badge className="text-xs text-white bg-destructive">
                        <small>Rejeté</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">275000</TableCell>
                      </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-8232397</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        Fournitures de Bureau
                      </TableCell>
                      <TableCell className="text-right md:text-left">
                        <Badge className="text-xs" variant="secondary">
                          <small>Fulfilled</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">75000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-12122775</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        Équipement Informatique
                      </TableCell>
                      <TableCell className="text-right md:text-left">
                        <Badge className="text-xs" variant="outline">
                          <small>Validé</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">89900</TableCell>
                    </TableRow>

                  </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Alertes
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            {/* <CardContent className="h-full max-h-20 md:max-h-80 flex items-center justify-center rounded-lg border border-dashed shadow-sm m-2" >
                <div className="flex flex-col items-center text-center">
                <h3 className="text-lg md:text-xl font-bold tracking-tight pt-4">
                    Aucune notification
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                    Les notifications concernant vos EDBs s&apos;afficheront ici.
                </p>
                </div>
            </CardContent> */}
            <CardContent>
            <Notifications items={mails.filter((item) => !item.read)} />
            </CardContent>
        </Card>
    </div>
  </main>
    </ContentLayout>

  )
}

