// app/hooks/use-allowed-roles.ts
"use client";

import { useSession } from "next-auth/react";

export const useAllowedRoles = () => {
  const { data: session } = useSession();
  const allowedReadRoles = [
    "ADMIN",
    "DIRECTEUR",
    "DIRECTEUR_GENERAL",
    "RESPONSABLE",
    "MAGASINIER",
    "RH",
    "AUDIT",
    "IT_ADMIN",
    "DAF",
    "DOG",
    "DCM",
    "DRH",
  ];
  const allowedWriteRoles = [
    "ADMIN",
    "IT_ADMIN",
    "DIRECTEUR_GENERAL",
    "DAF",
  ];
  const allowedFullAccessRoles = [
    "ADMIN",
  ];
  return {
    hasReadAccess: session?.user?.role && allowedReadRoles.includes(session.user.role as string),
    hasWriteAccess: session?.user?.role && allowedWriteRoles.includes(session.user.role as string),
    hasFullAccess: session?.user?.role && allowedFullAccessRoles.includes(session.user.role as string)
  };
};