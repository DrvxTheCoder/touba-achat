import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { EDB } from "../../etats-de-besoin/data/types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { SpinnerCircular } from "spinners-react"
import { EDBTableRow } from "../../etats-de-besoin/components/EDBTableRow"

export function QuickViewTabs() {
    const { data: session } = useSession();
    const [edbs, setEdbs] = useState<EDB[]>([]);
    const [selectedEDB, setSelectedEDB] = useState<EDB | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [total, setTotal] = useState(0);

    
  
    useEffect(() => {
      const fetchEDBs = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/edb/user?page=${page}&pageSize=${pageSize}`);
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
    }, [page, pageSize]);
  return (
    <Tabs defaultValue="edb" className="col-span-2">
      <TabsList className="">
        <TabsTrigger value="edb">EDB</TabsTrigger>
        <TabsTrigger value="odm" disabled>ODM</TabsTrigger>
      </TabsList>
      <TabsContent value="edb">
      <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center">
              <CardDescription>
              Vos états de besoins les plus recent.
              </CardDescription>
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
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center h-24">
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
      </TabsContent>
      <TabsContent value="odm">
      </TabsContent>
    </Tabs>
  )
}
