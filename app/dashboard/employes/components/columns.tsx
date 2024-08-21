"use client"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ExternalLink, Info, MoreHorizontal, Trash2, FilePen, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Employee } from "./data"
import { UpdateEmployeeForm } from "./forms/edit-user-form"
import { ToggleEmployeeStatusDialog } from "./delete-employee-dialog"
import { ResetPasswordSheet } from "./forms/password-reset"
import { useAllowedRoles } from "@/app/hooks/use-allowed-roles"

const ActionsCell = ({ employee, refreshData }: { employee: Employee, refreshData: () => void }) => {
  const { hasFullAccess } = useAllowedRoles();
  
  const handleUpdate = () => {
    refreshData();
  };

  const handleStatusChange = async () => {
    refreshData();
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
        <DropdownMenuItem>
          Voir EDBs
          <DropdownMenuShortcut><ExternalLink className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Info
          <DropdownMenuShortcut><Info className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
        </DropdownMenuItem>
        {hasFullAccess && 
          <>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ResetPasswordSheet userEmail={employee.email} userId={employee.userId}/>
              <DropdownMenuShortcut><KeyRound className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UpdateEmployeeForm employee={employee} onUpdate={handleUpdate} />
              <DropdownMenuShortcut><FilePen className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ToggleEmployeeStatusDialog
                isActive={employee.status === 'ACTIVE'} 
                employeeId={employee.id} 
                employeeName={employee.name} 
                onStatusChange={handleStatusChange} 
              />
              
            </DropdownMenuItem>
          </>
        }
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createColumns = (refreshData: () => void): ColumnDef<Employee>[] => [
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
    accessorKey: "status",
    header: "Statut",
  },
  {
    accessorKey: "phoneNumber",
    header: "Téléphone",
  },
  {
    accessorKey: "currentDepartment.name",
    header: "Département",
    cell: ({ row }) => row.original.currentDepartment?.name || 'N/A',
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original;
      return <ActionsCell employee={employee} refreshData={refreshData} />;
    },
  },
];
