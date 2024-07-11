// import * as React from "react"
// import { useState, useEffect } from 'react';
// import {
//   ColumnFiltersState,
//   SortingState,
//   VisibilityState,
//   flexRender,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   useReactTable,
// } from "@tanstack/react-table"

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { createColumns } from "./columns"
// import { Employee, getEmployees } from "./data"
// import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

// export function DataTableDemo({ initialData }: { initialData: any }) {
//   const [data, setData] = useState(initialData)
//   const [totalPages, setTotalPages] = React.useState(0)
//   const [currentPage, setCurrentPage] = React.useState(1)
//   const [pageSize, setPageSize] = React.useState(5)
//   const [totalCount, setTotalCount] = React.useState(0)
//   const [sorting, setSorting] = React.useState<SortingState>([])
//   const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
//   const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
//   const [rowSelection, setRowSelection] = React.useState({})

//   const fetchData = React.useCallback(async () => {
//     const sortField = sorting.length > 0 ? sorting[0].id : 'name'
//     const sortOrder = sorting.length > 0 ? sorting[0].desc ? 'desc' : 'asc' : 'asc'
//     const searchTerm = columnFilters.find(filter => filter.id === 'name')?.value as string || ''

//     const response = await getEmployees(currentPage, pageSize, searchTerm, sortField, sortOrder)
//     setData(response.employees)
//     setTotalPages(response.totalPages)
//     setTotalCount(response.totalCount)
//   }, [currentPage, pageSize, sorting, columnFilters])

//   React.useEffect(() => {
//     fetchData()
//   }, [fetchData])

//   const table = useReactTable({
//     data,
//     createColumns,
//     onSortingChange: setSorting,
//     onColumnFiltersChange: setColumnFilters,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     onColumnVisibilityChange: setColumnVisibility,
//     onRowSelectionChange: setRowSelection,
//     state: {
//       sorting,
//       columnFilters,
//       columnVisibility,
//       rowSelection,
//       pagination: {
//         pageIndex: currentPage - 1,
//         pageSize: pageSize,
//       },
//     },
//     manualPagination: true,
//     pageCount: totalPages,
//   })

//   return (
//     <div className="w-full">
//       <div className="flex items-center py-2">
//         <Input
//           placeholder="Filtrer..."
//           value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
//           onChange={(event) =>
//             table.getColumn("name")?.setFilterValue(event.target.value)
//           }
//           className="w-64 lg:max-w-sm"
//         />
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="outline" className="ml-auto">
//               Colonnes
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             {table
//               .getAllColumns()
//               .filter((column) => column.getCanHide())
//               .map((column) => {
//                 return (
//                   <DropdownMenuCheckboxItem
//                     key={column.id}
//                     className="capitalize"
//                     checked={column.getIsVisible()}
//                     onCheckedChange={(value) =>
//                       column.toggleVisibility(!!value)
//                     }
//                   >
//                     {column.id}
//                   </DropdownMenuCheckboxItem>
//                 )
//               })}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>
//       <div className="rounded-md border w-[22.2rem] lg:w-full">
//       <Table>
//           <TableHeader>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id}>
//                 {headerGroup.headers.map((header) => {
//                   return (
//                     <TableHead key={header.id}>
//                       {header.isPlaceholder
//                         ? null
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                     </TableHead>
//                   )
//                 })}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody>
//             {table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row) => (
//                 <TableRow
//                   key={row.id}
//                   data-state={row.getIsSelected() && "selected"}
//                 >
//                   {row.getVisibleCells().map((cell) => (
//                     <TableCell key={cell.id} className="text-left">
//                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={createolumns.length} className="h-24 text-center">
//                   Aucun resultat.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//       <div className="flex items-center justify-between space-x-2 py-4">
//         <div className="flex items-center space-x-6 lg:space-x-8">
//           <div className="flex items-center space-x-2">
//             <p className="text-sm font-medium">Lignes par page</p>
//             <Select
//               value={`${pageSize}`}
//               onValueChange={(value) => {
//                 setPageSize(Number(value))
//                 setCurrentPage(1)
//               }}
//             >
//               <SelectTrigger className="h-8 w-[70px]">
//                 <SelectValue placeholder={pageSize} />
//               </SelectTrigger>
//               <SelectContent side="top">
//                 {[5, 10, 20, 30, 40, 50].map((pageSize) => (
//                   <SelectItem key={pageSize} value={`${pageSize}`}>
//                     {pageSize}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="flex w-[100px] items-center justify-center text-sm font-medium">
//             Page {currentPage} sur {totalPages}
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button
//               variant="outline"
//               className="hidden h-8 w-8 p-0 lg:flex"
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1}
//             >
//               <span className="sr-only">Première Page</span>
//               <ChevronsLeft className="h-4 w-4" />
//             </Button>
//             <Button
//               variant="outline"
//               className="h-8 w-8 p-0"
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//             >
//               <span className="sr-only">Page précédente</span>
//               <ChevronLeft className="h-4 w-4" />
//             </Button>
//             <Button
//               variant="outline"
//               className="h-8 w-8 p-0"
//               onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//               disabled={currentPage === totalPages}
//             >
//               <span className="sr-only">Page Suivante</span>
//               <ChevronRight className="h-4 w-4" />
//             </Button>
//             <Button
//               variant="outline"
//               className="hidden h-8 w-8 p-0 lg:flex"
//               onClick={() => setCurrentPage(totalPages)}
//               disabled={currentPage === totalPages}
//             >
//               <span className="sr-only">Dernière Page</span>
//               <ChevronsRight className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }