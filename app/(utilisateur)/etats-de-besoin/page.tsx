import Link from "next/link";

import PlaceholderContent from "../components/placeholder";
import { ContentLayout } from "@/components/user-panel/content-layout";
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  PlusCircle,
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
  PackageIcon
} from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function EtatsDeBesoinPage() {
  return (
    <>
    <ContentLayout title="Etats de Besoins">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Acceuil</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Etats de Besoins</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-8">
        <div>
          <div className="flex items-center justify-between space-y-2">
              <h2 className="text-lg md:text-3xl font-bold tracking-tight">Mes états de besoins</h2>
              <div className="flex items-center space-x-2">
                <Link href="/etats-de-besoin/nouveau"><Button>Nouveau <PlusCircle className="ml-2 h-4 w-4"/></Button></Link>
                </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-2">
          <Input placeholder="Recherche..." className="h-10 w-sm lg:max-w-sm"/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1 text-sm"
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Filtrer</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>
              Tout
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>
              Delivré
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>
              En cours
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>
              Validé
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>
              Non Validé
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>
              Rejeté
            </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        <div className="grid flex-1 items-start  md:gap-4 lg:grid-cols-3 xl:grid-cols-3">
          {/* start main */}
          
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
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
                    <TableHead className="hidden sm:table-cell">
                      Statut
                    </TableHead>
                    <TableHead className="text-right rounded-r-lg">
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
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant="secondary">
                        <small>Soumis</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">56040</TableCell>
                      </TableRow>
                      <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-5612098</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        Matériel Industriel
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs text-white bg-destructive">
                        <small>Rejeté</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">275000</TableCell>
                      </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-8232397</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        Fournitures de Bureau
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant="secondary">
                          <small>Fulfilled</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">75000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-12122775</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        Équipement Informatique
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant="outline">
                          <small>Validé</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">89900</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium"># EDB-12135654</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                      Équipement Informatique
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs bg-primary text-white">
                          <small>Délivré</small>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">1500000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                <div className="text-xs text-muted-foreground">
                  Mis à jour: <time dateTime="2024-11-23">12 Juillet 2024</time>
                </div>
                <Pagination className="ml-auto mr-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <Button size="icon" variant="outline" className="h-6 w-6">
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="sr-only">Précédent</span>
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <Button size="icon" variant="outline" className="h-6 w-6">
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="sr-only">Suivant</span>
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardFooter>
            </Card>
          </div>
          <div>
              <Card
                className="overflow-hidden lg:block hidden"
              >
                <CardHeader className="flex flex-row items-start border-b">
                  <div className="grid gap-0.5">
                    <CardTitle className="group flex items-center gap-2 text-lg hover:underline underline-offset-2">
                      # EDB-12122775
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copier ID EDB</span>
                      </Button>
                    </CardTitle>
                    <CardDescription>Statut: <Badge className="text-xs ml-1" variant="outline"> Validé </Badge></CardDescription>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                        Traquer
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
                        <DropdownMenuItem>Exporter</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-sm">
                  <div className="grid gap-3">
                    <ul className="grid gap-3">
                    <li className="flex items-center justify-between">
                      <span className="font-semibold">Désignation</span>
                      <span className="font-semibold">QTE</span>
                    </li>
                    </ul>
                    <ul className="grid gap-1">
                      <li className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Moniteur HP 24 Pouces - HP24Zn
                        </span>
                        <span>x 1</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Adaptateur USB-C
                        </span>
                        <span>x 1</span>
                      </li>
                    </ul>
                    <Separator className="my-2" />
                    <ul className="grid">
                      <li className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">Total - Estimé (XOF)</span>
                        <span>0.00</span>
                      </li>
                    </ul>
                  </div>
                  <Separator className="my-4" />
                    <div className="font-semibold">Document Rattaché</div>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md py-3">
                      <div className="flex w-max space-x-1 p-1 justify-start gap-1 ">
                         <Button variant="outline" className="text-xs"> <Paperclip className="h-4 w-4 mr-1"/> Pro Forma #1</Button>
                         <Button variant="outline" className="text-xs"> <Paperclip className="h-4 w-4 mr-1"/> Pro Forma #2</Button>
                      </div>
                      <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
                  <div className="text-xs text-muted-foreground">
                    Date: <time dateTime="2024-06-06">2024-06-06</time>
                  </div>
                </CardFooter>
              </Card>
          </div>
          {/* end main */}
        </div>


      </main>
      
    </ContentLayout>
    </>
  );
}
