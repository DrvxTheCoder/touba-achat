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
import { UpdateEmployeeForm } from "./forms/edit-user-form"
import { DeleteEmployeeDialog } from "./delete-employee-dialog"

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
    header: "Département",
    cell: ({ row }) => {
      const department = row.original.department
      return department ? department.name : 'N/A'
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original

      const handleUpdate = (updatedEmployee: Employee) => {
        // Implement your update logic here
        console.log("Updating employee:", updatedEmployee);
        // You might want to call an API endpoint to update the employee
        // and then refresh the table data
      };

      const handleDelete = () => {
        // Implement your delete logic here
        console.log("Deleting employee:", employee.id);
        // You might want to call an API endpoint to delete the employee
        // and then refresh the table data
      };

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
            <DropdownMenuItem>Info</DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UpdateEmployeeForm employee={employee} onUpdate={handleUpdate} />
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <DeleteEmployeeDialog employeeName={employee.name} onDelete={handleDelete} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]