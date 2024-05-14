import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';

const Custom404: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <div
      className="flex flex-1 items-center justify-center rounded-lg border shadow-sm" x-chunk="dashboard-02-chunk-1"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          ERROR 404 - Page Introuvable
        </h3>
        <p className="text-sm text-muted-foreground">
          Vous vous etes perdu? Retournez à la page d&apos;acceuil en cliquant ici.
        </p>
        <Button className="mt-4">Retourner au dashboard</Button>
      </div>
    </div>
  </main>
  );
};

export default Custom404;
