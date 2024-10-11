import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';


import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { UserAuthForm } from "./components/user-auth-form";
import CustomLogoSVG from "@/components/logos/CustomLogoSVG";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default function AuthenticationPage() {
  return (
    <>
    <title>ToubaApp™ - Appli Officiel de Touba Oil SAU</title>
      <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col p-6 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900 opacity-70" />
          <Image
            src="/assets/img/bg-touba.jpg"
            alt="Touba Oil background"
            fill
            style={{ objectFit: 'cover' }}
            className="absolute inset-0 opacity-20"
          />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <CustomLogoSVG width="2rem" height="2rem" />
            Touba-App™
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <i className="text-lg">
                &ldquo;La formule du succès : se lever tôt, travailler dur, trouver du pétrole.&rdquo;
              </i>
              <footer className="text-sm">J. Paul Getty</footer>
            </blockquote>
          </div>
        </div>
        <div className=" mt-36 justify-center lg:mt-12">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[30rem] border rounded-lg shadow-lg p-6">
            <div className="flex flex-col space-y-1 text-center">
              
              <h1 className="text-3xl font-bold tracking-tight">
                Connexion
              </h1>
              <p className="white text-xs text-muted-foreground">
              Connexion à l&apos;appli ToubaApp.
              </p>
            </div>
            <UserAuthForm />
            <small className="px-6 text-xs text-center text-muted-foreground">
            En cliquant sur Continuer, vous acceptez nos{" "}
              <Link
                href="#"
                className="underline underline-offset-4 hover:text-primary"
              >
                Conditions d&apos;utilisation
              </Link>{" "}
              et notre{" "}
              <Link
                href="#"
                className="underline underline-offset-4 hover:text-primary"
              >
                Politique de confidentialité
              </Link>
              .
            </small>
          </div>
        </div>
      </div>
    </>
  );
}
