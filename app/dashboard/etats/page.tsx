"use client"
import * as React from "react"
import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  DollarSign,
  File,
  Home,
  ListFilter,
  MoreVertical,
  Package,
  Package2,
  PanelLeft,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  Users2,
  TrendingDown,
  TrendingUp,
  Paperclip,
  PackageIcon,
  RefreshCcwIcon,
  RefreshCwIcon,
  Clock,
  Ban,
  FileCheck2,
  BadgeCheck
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PlusCircle } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { edbData, EDB } from './data-two/data'
import { EDBTableRow } from './data-two/EDBTableRow'
import { CategoriesDialog } from "./components/categories-dialog"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import MetricCard from "./components/metricCard"
import { useEDBs } from "./components/use-edbs"

const ITEMS_PER_PAGE = 5;

export default function Etats() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEDB, setSelectedEDB] = useState<EDB | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  const { paginatedData, isLoading, error } = useEDBs(currentPage, ITEMS_PER_PAGE, searchTerm, statusFilter);

  const handleRowClick = (edb: EDB) => {
    setSelectedEDB(prevSelected => prevSelected?.id === edb.id ? null : edb);
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  const handleFilterChange = (value: string) => {
    setStatusFilter(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
    setCurrentPage(1);
  }
  
  return (
    <>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
      <div>
          <div className="flex items-center justify-between space-y-2">
              <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins</h2>
              <div className="flex items-center space-x-2">
                <CategoriesDialog />
                <Link href="/dashboard/etats/nouveau"><Button variant="outline">Nouveau <PlusCircle className="ml-2 h-4 w-4"/></Button></Link>
              </div>
          </div>
        </div>
        <div className="grid flex-1 items-start md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            
              {/* <Card className="sm:col-span-2">
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
              </Card> */}
              <MetricCard />
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total
                  </CardTitle>
                  <PackageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">55</div>
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
              <div className="flex items-center">
                {/* <RadioGroup>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="jour" id="jour" className="h-3.5 w-3.5"/>
                      <Label htmlFor="jour"><text className="lg:hidden">S</text><text className="hidden lg:block text-xs">Semaine</text></Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="mois" id="mois" className="h-3.5 w-3.5"/>
                      <Label htmlFor="mois"><text className="lg:hidden">M</text><text className="hidden lg:block text-xs">Mois</text></Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="annee" id="annee" className="h-3.5 w-3.5"/>
                      <Label htmlFor="annee"><text className="lg:hidden">A</text><text className="hidden lg:block text-xs">Année</text></Label>
                    </div>
                  </div>   
                </RadioGroup> */}
                {/* <TabsList>
                  <TabsTrigger value="week">Semaine</TabsTrigger>
                  <TabsTrigger value="month">Mois</TabsTrigger>
                  <TabsTrigger value="year">Année</TabsTrigger>
                </TabsList> */}
                <div className="ml-auto flex items-center gap-2">
                  <Input 
                    placeholder="Recherche..." 
                    className="h-7 w-sm lg:max-w-sm ml-2"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-sm"
                      >
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Filtrer</span>
                        {statusFilter.length !== 0 && (<small>{statusFilter.length}</small>)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {['Non-validé', 'Validé', 'Rejeté', 'Délivré', 'En cours'].map((status) => (
                        <DropdownMenuCheckboxItem 
                          key={status}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={() => handleFilterChange(status)}
                        >
                          {status}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-sm"
                  >
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Exporter</span>
                  </Button>
                </div>
              </div>
              <div>
                <Card>
                  <CardContent className="pt-5">
                    <Table>
                    <TableHeader className="bg-muted">
                        <TableRow className="rounded-lg border-0">
                        <TableHead className="rounded-l-lg">
                            ID
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">
                            Catégorie
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            Statut
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            Département
                        </TableHead>
                        <TableHead className="text-right rounded-r-lg">
                            Montant (XOF)
                        </TableHead>
                        <TableHead className="lg:hidden">
                            {''}
                        </TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Chargement...
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-red-500">
                            Erreur: {error}
                          </TableCell>
                        </TableRow>
                      ) : paginatedData?.edbs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Aucun EDB trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData?.edbs.map((edb) => (
                          <EDBTableRow 
                            key={edb.id} 
                            edb={edb} 
                            onRowClick={handleRowClick}
                            isSelected={selectedEDB?.id === edb.id}
                          />
                        ))
                      )}
                    </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                    <div className="flex flex-row items-center gap-1 text-xs text-muted-foreground">
                    <Button size="icon" variant="outline" className="h-6 w-6">
                        <RefreshCwIcon className="h-3 w-3 animate-spin" />
                        <span className="sr-only">Précédent</span>
                    </Button>
                      <div>Mis à jour: <time dateTime="2024-11-23">12 Juillet 2024</time></div>
                    </div>
                    <Pagination className="ml-auto mr-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-6 w-6"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1 || isLoading}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span className="sr-only">Précédent</span>
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-6 w-6"
                          onClick={() => setCurrentPage(prev => Math.min(paginatedData?.totalPages || 1, prev + 1))}
                          disabled={currentPage === paginatedData?.totalPages || isLoading}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                          <span className="sr-only">Suivant</span>
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  </CardFooter>
                </Card>
              </div>
          </div>
          
          {/* Right-side card for EDB details */}
          <div>
            <Card className="overflow-hidden lg:block hidden">
              {selectedEDB ? (
                <>
                <CardHeader className="flex flex-row items-start border-b">
                  <div className="grid gap-0.5">
                    <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
                      # {selectedEDB.id}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copier ID EDB</span>
                      </Button>
                    </CardTitle>
                    <CardDescription>Statut: 
                    <Badge className="text-xs ml-1"
                      variant={selectedEDB.status === "Rejeté" ? "destructive" : 
                        selectedEDB.status === "Validé" ? "outline" :
                        selectedEDB.status === "Délivré" ? "default" : "secondary"}
                      >
                     {selectedEDB.status}
                    </Badge>
                    </CardDescription>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                        Tracker
                      </span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <MoreVertical className="h-3.5 w-3.5" />
                          <span className="sr-only">Plus</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        
                        <DropdownMenuItem>Joindre document(s)
                          <DropdownMenuShortcut><Paperclip className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Bon de Commande
                        <DropdownMenuShortcut><FileCheck2 className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-primary">Valider
                        <DropdownMenuShortcut><BadgeCheck className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Rejeter
                        <DropdownMenuShortcut><Ban className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
                        </DropdownMenuItem>

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-sm">
                
                  <div className="grid gap-3">
                    <small className="text-xs text-muted-foreground"><b>Titre:</b> {selectedEDB.title}</small>
                    <ul className="grid gap-3">
                    <li className="flex items-center justify-between px-3">
                      <span className="font-semibold">Désignation</span>
                      <span className="font-semibold">QTE</span>
                    </li>
                    </ul>
                    <ul className="grid gap-3">
                      <ScrollArea className="w-full rounded-md h-14 p-2 border">
                      {selectedEDB.items.map((item, index) => (
                        <li className="flex items-center justify-between" key={index}>
                          <span className="text-muted-foreground">{item.name}</span>
                          <span>x {item.quantity}</span>
                        </li>
                      ))}
                      </ScrollArea>
                    </ul>
                    <span className="font-semibold">Références Techniques</span>
                    <span className="text-muted-foreground">Non-renseigné</span>
                    <Separator className="my-2" />
                    <ul className="grid gap-3">
                      <li className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">Total - Estimé (XOF)</span>
                        <span>{selectedEDB.amount}</span>
                      </li>
                    </ul>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid gap-3">
                    <div className="font-semibold">Information Employé</div>
                    <dl className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Nom et Prenom</dt>
                        <dd>{selectedEDB.employee.name}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Departement</dt>
                        <dd>
                          <dd>{selectedEDB.department}</dd>
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Email</dt>
                        <dd>
                          <a href="mailto:djamilla.sylla@touba-oil.com">{selectedEDB.email}</a>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <Separator className="my-4" />
                    <div className="font-semibold">Document Rattaché (Service ACHAT)</div>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
                      <div className="flex w-max space-x-1 p-1 justify-start gap-1 ">
                      {selectedEDB.documents.map((document, index) => (
                        <>
                         <Button variant="outline" className="text-xs"> <Paperclip className="h-4 w-4 mr-1" key={index}/>{document}</Button>
                         </>
                      ))}
                      </div>
                    
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                  <div className="text-xs text-muted-foreground">
                    Date: <time dateTime={selectedEDB.date}>{selectedEDB.date}</time>
                  </div>
                </CardFooter>
                </>
              ) : (
                <CardContent className="p-6 text-sm text-center text-muted-foreground">
                  Sélectionnez un EDB pour voir les détails
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}