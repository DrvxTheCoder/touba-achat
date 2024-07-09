"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { Progress } from "@/components/ui/progress"
import CustomLogoSVG from '@/components/logos/CustomLogoSVG';
import { title } from 'process';

const HomeRedirect: React.FC = () => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchSession = async () => {
      // Start progress
      setProgress(10);

      // Simulate some loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(30);

      const session = await getSession();
      setProgress(60);

      // Simulate some more loading time
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(90);

      if (!session) {
        router.replace('/auth');
      } else {
        router.replace('/dashboard');
      }
      
      // Complete progress
      setProgress(100);
    };
    
    fetchSession();
  }, [router]);

  return (
    <>
      <title>ToubaApp™ - Appli Officiel de Touba Oil SAU</title>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CustomLogoSVG className="w-20 h-20 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Chargement...</h1>
        <Progress value={progress} className="w-[20%] mb-4" />
        <p className="text-muted-foreground">{progress}%</p>
      </div>
    </>

  );
}

export default HomeRedirect;