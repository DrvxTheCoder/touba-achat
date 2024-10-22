"use client"
import Link from "next/link";
import { signOut } from 'next-auth/react';
import { usePathname } from "next/navigation";
import clsx from "clsx";
import CustomLogoSVG from "@/components/logos/CustomLogoSVG";
import { ModeToggle } from "./user-panel/mode-toggle";
import { Input } from "@/components/ui/input";
import { Home, Menu, Package, ShoppingCart, Users, SettingsIcon, Search, CircleUser, LogOut, HomeIcon, User, Layout, LayoutGrid, BellIcon, LuggageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
    DropdownMenuShortcut
  } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useAllowedRoles } from "@/app/hooks/use-allowed-roles"
import CustomLogoSVGTwo from "./logos/CustomLogoSVGTwo";
import { CommandMenu } from "@/components/command-menu";
import { NotificationCenter } from "@/components/NotificationCenter";
import { translateRole } from "@/app/utils/translate-roles";

export default function Header (){
    const { data: session } = useSession();
    const pathname = usePathname();
    const { hasReadAccess, hasWriteAccess } = useAllowedRoles()

    const getInitials = (name: string) => {
      const words = name.split(' ');
      if (words.length > 1) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      }
      return words[0][0].toUpperCase();
    };

    const links = hasReadAccess ? [
      { href: "/dashboard", icon: LayoutGrid, label: "Dashboard", badgeCount: 0 },
      { href: "/acceuil", icon: HomeIcon, label: "Accueil", badgeCount: 0 },
      { href: "/dashboard/etats", icon: Package, label: "États de Besoins", badgeCount: 0 },
      { href: "/dashboard/odm", icon: LuggageIcon, label: "Ordres de Missions", badgeCount: 0 },
      { href: "/dashboard/employes", icon: Users, label: "Employés", badgeCount: 0 },
      // { href: "/dashboard/parametres", icon: SettingsIcon, label: "Paramètres", badgeCount: 0 }
  ] : [
      { href: "/dashboard", icon: LayoutGrid, label: "Dashboard", badgeCount: 0 },
      { href: "/dashboard/etats", icon: Package, label: "États de Besoins", badgeCount: 0 },
  ];

  const isLinkActive = (href: string) => {
      if (href === "/dashboard") {
          return pathname === "/dashboard"; // Dashboard is active only on exact match
      }
      return pathname.startsWith(href); // Other links are active on nested routes
  };

    return(
        <header className="absolute sticky w-full z-10 backdrop-blur-sm top-0 flex h-14 gap-4 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 lg:hidden mr-2"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold pb-3 text-primary"
              >
                <CustomLogoSVG width="2rem" />
                Touba-App™
              </Link>
              {links.map((link, index) => (

                <Link 
                    href={link.href}
                    key={index} 
                    className={clsx(
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2",
                        {
                            "bg-muted text-foreground hover:text-foreground": isLinkActive(link.href),
                            "text-muted-foreground hover:text-foreground": !isLinkActive(link.href),
                        }
                    )}
                >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                    {link.badgeCount > 0 && (
                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                       {link.badgeCount} 
                    </Badge>)}
                </Link>
                ))}
            </nav>
            <div className="mt-auto">
          <Button onClick={() => signOut()} variant="outline" className="w-full justify-center h-10 mt-5">
            Déconnexion
          </Button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
          <CommandMenu />
        </div>
        <NotificationCenter />
        <ModeToggle/>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
                <AvatarImage src="assets/touba-logo-192x.png" alt="@shadcn" />
                <AvatarFallback>{session?.user?.name ? getInitials(session.user.name) : 'TT'}</AvatarFallback>
            </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session?.user?.name || 'Utilisateur'} </p>
            <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
            <p className="text-xs leading-none text-muted-foreground">Role :  {translateRole(session?.user?.role.toString())}</p>
            </div>
            </DropdownMenuLabel>
              
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
            <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/acceuil" className="flex items-center">
              <HomeIcon className="w-4 h-4 mr-3 text-muted-foreground" />
              Acceuil
            </Link>
          </DropdownMenuItem>
            {/* <DropdownMenuItem>
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
                Profil           
            </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link href={"/auth"}>
            <DropdownMenuItem onClick={() => signOut()}>
              Déconnexion
            <DropdownMenuShortcut><LogOut className="h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            </Link>
        </DropdownMenuContent>
        </DropdownMenu>
      </header>
    );
}