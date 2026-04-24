"use client"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Info, MoreHorizontal, FilePen, KeyRound, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { UserInfoDialog } from "./UserInfoDialog"
import { SessionsDialog } from "./SessionsDialog"

function OnlineIndicator({ isOnline }: { isOnline: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-6 h-6">
            <span className="relative flex h-2.5 w-2.5">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOnline ? 'En ligne' : 'Hors ligne'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const ActionsCell = ({ employee, refreshData }: { employee: Employee, refreshData: () => void }) => {
  const { hasFullAccess } = useAllowedRoles();

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
        {hasFullAccess && (
          <>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <SessionsDialog userId={employee.userId} userName={employee.name} />
              <DropdownMenuShortcut><Monitor className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UserInfoDialog userId={employee.userId} />
              <DropdownMenuShortcut><Info className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ResetPasswordSheet userEmail={employee.email} userId={employee.userId} />
              <DropdownMenuShortcut><KeyRound className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UpdateEmployeeForm employee={employee} onUpdate={refreshData} />
              <DropdownMenuShortcut><FilePen className="ml-4 h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ToggleEmployeeStatusDialog
                isActive={employee.status === 'ACTIVE'}
                employeeId={employee.id}
                employeeName={employee.name}
                onStatusChange={refreshData}
              />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createColumns = (refreshData: () => void): ColumnDef<Employee>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 h-auto font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nom Complet
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="hidden sm:inline text-xs text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "matriculation",
    header: "Matricule",
    cell: ({ row }) => (
      <span className="text-xs font-mono">{row.original.matriculation}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => <OnlineIndicator isOnline={row.original.isOnline} />,
  },
  {
    accessorKey: "phoneNumber",
    header: "Téléphone",
    cell: ({ row }) => (
      <span className="hidden md:inline text-xs">{row.original.phoneNumber || 'N/A'}</span>
    ),
  },
  {
    accessorKey: "départment",
    header: "Département",
    cell: ({ row }) => (
      <span className="hidden md:inline text-xs">{row.original.currentDepartment?.name || 'N/A'}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell employee={row.original} refreshData={refreshData} />,
  },
];
