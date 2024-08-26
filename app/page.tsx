"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Progress } from "@/components/ui/progress"
import CustomLogoSVG from '@/components/logos/CustomLogoSVG';

const HomeRedirect: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const redirectUser = async () => {
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(30);

      if (status === 'loading') {
        setProgress(50);
        return;
      }

      setProgress(70);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!session) {
        router.replace('/auth');
      } else {
        if (['ADMIN', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'MAGASINIER', 'RH', 'AUDIT', 'RESPONSABLE'].includes(session.user.role)) {
          router.replace('/dashboard');
        } else {
          router.replace('/acceuil');
        }
      }

      setProgress(100);
    };
    
    redirectUser();
  }, [router, session, status]);

  return (
    <>
      <title>ToubaApp™ - Appli Officiel de Touba Oil SAU</title>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CustomLogoSVG className="w-20 h-20 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Chargement...</h1>
        <Progress value={progress} className="w-[70%] md:w-[20%] mb-4" />
        <p className="text-muted-foreground">{progress}%</p>
      </div>
    </>
  );
}

export default HomeRedirect;