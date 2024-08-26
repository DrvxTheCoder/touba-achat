import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, Building, Briefcase, Hash, Package2, Info } from "lucide-react";
import { translateRole } from '@/app/utils/translate-roles';
import Link from 'next/link';

interface UserInfoProps {
  userId: number;
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  employee?: {
    matriculation: string;
    phoneNumber?: string;
    currentDepartment: {
      name: string;
    };
  };
  totalEDBs: number;
}

export const UserInfoDialog: React.FC<UserInfoProps> = ({ userId }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/employee/${userId}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des informations utilisateur');
        }
        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        setError('Erreur lors du chargement des informations utilisateur');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserInfo();
    }
  }, [userId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="w-full">Informations</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Informations Utilisateur</DialogTitle>
        </DialogHeader>
        {isLoading && <p>Chargement...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {userInfo && (
          <div className="grid gap-4 py-4 text-sm">
            <div className="flex items-center gap-4">
              <User className="h-4 w-4" />
              <p>Nom complet: {userInfo.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="h-4 w-4" />
              <p>Email: <Link className="text-primary" href={`mailto:${userInfo.email}`}>{userInfo.email}</Link></p>
            </div>
            <div className="flex items-center gap-4">
              <Briefcase className="h-4 w-4" />
              <p>Rôle: {translateRole(userInfo.role)}</p>
            </div>
            {userInfo.employee && (
              <>
                <div className="flex items-center gap-4">
                  <Building className="h-4 w-4" />
                  <p>Département: {userInfo.employee.currentDepartment.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Hash className="h-4 w-4" />
                  <p>Matricule: {userInfo.employee.matriculation}</p>
                </div>
                {userInfo.employee.phoneNumber && (
                  <div className="flex items-center gap-4">
                    <Phone className="h-4 w-4" />
                    <p>Téléphone: {userInfo.employee.phoneNumber}</p>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-4">
              <Info className="h-4 w-4" />
              <p>Statut: {userInfo.status}</p>
            </div>
            <div className="flex items-center gap-4">
              <Package2 className="h-4 w-4" />
              <p>Total EDBs: {userInfo.totalEDBs}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};