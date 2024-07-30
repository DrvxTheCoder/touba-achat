import { useSession } from "next-auth/react"

export const useAllowedRoles = () => {
    const { data: session } = useSession()
    const allowedReadRoles = [
        "ADMIN",
        "DIRECTEUR",
        "DIRECTEUR_GENERAL",
        "RESPONSABLE",
        "MAGASINIER",
        "RH",
        "AUDIT",
        "IT_ADMIN"
    ]
    const allowedWriteRoles = [
        "ADMIN",
        "IT_ADMIN"
    ];
    return {
      hasReadAccess: session && allowedReadRoles.includes(session.user.role),
      hasWriteAccess: session && allowedWriteRoles.includes(session.user.role),
    }
  }