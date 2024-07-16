import { useSession } from "next-auth/react"

export const useAllowedRoles = () => {
    const { data: session } = useSession()
    const allowedReadRoles = [
        "ADMIN",
        "DIRECTEUR",
        "DIRECTEUR_GENERALE",
        "RESPONSABLE",
        "RH",
        "AUDIT"
    ]
    const allowedWriteRoles = [
        "ADMIN"
    ];
    return {
      hasReadAccess: session && allowedReadRoles.includes(session.user.role),
      hasWriteAccess: session && allowedWriteRoles.includes(session.user.role),
    }
  }