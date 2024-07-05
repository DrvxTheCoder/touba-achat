"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Employee } from "./data"

export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nom Complet
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "matriculation",
    header: "Matricule",
  },
  {
    accessorKey: "phoneNumber",
    header: "Téléphone",
  },
  {
    accessorKey: "department",
    header: "Départment",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-bold">ACTIONS</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(employee.id.toString())}
        >
          Copier l&apos;ID
        </DropdownMenuItem>
        <DropdownMenuItem>Détails de l&apos;employé</DropdownMenuItem>
        <DropdownMenuItem>Modifier l&apos;employé</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]