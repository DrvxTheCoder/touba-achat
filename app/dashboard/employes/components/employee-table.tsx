import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createColumns } from "./columns"
import { Employee, EmployeeResponse, getEmployees } from "./data"
import { ChevronLeft, ChevronRight, Columns2, File, RefreshCwIcon } from "lucide-react";
import { SpinnerCircular } from "spinners-react";
import * as XLSX from 'xlsx';

interface EmployeeDataTableProps {
  initialData: EmployeeResponse;
  selectedDepartmentId: number | null;
}

const columnLabels: { [key: string]: string } = {
  name: "Nom Complet",
  email: "Email",
  matriculation: "Matricule",
  status: "Statut",
  phoneNumber: "Téléphone",
  "currentDepartment.name": "Département",
  actions: "Actions",
};

export function EmployeeDataTable({ initialData, selectedDepartmentId }: EmployeeDataTableProps) {
  const [data, setData] = useState<Employee[]>(initialData.employees)
  const [totalPages, setTotalPages] = useState(initialData.totalPages)
  const [currentPage, setCurrentPage] = useState(initialData.currentPage)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(initialData.totalCount)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = useCallback(async (page: number, size: number, filters: ColumnFiltersState, sort: SortingState) => {
    setIsLoading(true);
    const sortField = sort.length > 0 ? sort[0].id : 'name'
    const sortOrder = sort.length > 0 ? (sort[0].desc ? 'desc' : 'asc') : 'asc'
    const searchTerm = filters.find(filter => filter.id === 'name')?.value as string || ''
    try {
      const response = await getEmployees(page, size, searchTerm, sortField, sortOrder, selectedDepartmentId)
      setData(response.employees)
      setTotalPages(response.totalPages)
      setCurrentPage(response.currentPage)
      setTotalCount(response.totalCount)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartmentId])

  const refreshData = useCallback(() => {
    fetchData(currentPage, pageSize, columnFilters, sorting);
  }, [fetchData, currentPage, pageSize, columnFilters, sorting]);

  const columns = useMemo(() => createColumns(refreshData), [refreshData]);

  useEffect(() => {
    setData(initialData.employees);
    setTotalPages(initialData.totalPages);
    setCurrentPage(1);
    setTotalCount(initialData.totalCount);
    setSorting([]);
    setColumnFilters([]);
    fetchData(1, pageSize, [], []);
  }, [initialData, selectedDepartmentId, pageSize, fetchData]);

  useEffect(() => {
    fetchData(currentPage, pageSize, columnFilters, sorting);
  }, [fetchData, currentPage, pageSize, columnFilters, sorting]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
    manualPagination: true,
    pageCount: totalPages,
  })

  const handleExport = () => {
    const exportData = data.map(emp => ({
      'Nom': emp.name,
      'Email': emp.email,
      'Matricule': emp.matriculation,
      'Statut': emp.status,
      'Téléphone': emp.phoneNumber || 'N/A',
      'Département': emp.currentDepartment?.name || 'N/A',
      'Fonction': emp.jobTitle,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employés");
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 35 }, { wch: 20 },
    ];
    XLSX.writeFile(workbook, "Employes.xlsx");
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center mb-4">
        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder="Recherche..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
            className="h-7 w-sm lg:max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                <Columns2 className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Colonnes</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Afficher / masquer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {columnLabels[col.id] || col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-sm" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Exporter</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-5 p-1 md:p-4">
          <Table>
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="rounded-lg border-0">
                  {headerGroup.headers.map((header, i) => {
                    const isFirst = i === 0;
                    const isLast = i === headerGroup.headers.length - 1;
                    return (
                      <TableHead
                        key={header.id}
                        className={`${isFirst ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex justify-center items-center h-24">
                      <SpinnerCircular size={40} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Aucun employé trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
          <div className="flex flex-row items-center gap-1 text-xs text-muted-foreground w-full">
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Rafraîchir</span>
            </Button>
            <div className="hidden md:block">{lastUpdated.toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <ChevronLeft className="h-3.5 w-3.5 -ml-2" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-sm text-muted-foreground hidden md:inline">Page</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (v >= 1 && v <= totalPages) setCurrentPage(v);
                }}
                className="h-6 w-12 text-xs"
              />
              /
              <span className="flex flex-row text-sm text-muted-foreground hidden md:inline"> {totalPages}</span>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || isLoading}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <ChevronRight className="h-3.5 w-3.5 -ml-2" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
