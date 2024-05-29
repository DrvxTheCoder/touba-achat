"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import CustomLogoSVG from "@/components/logos/CustomLogoSVG";
import { ModeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Home, Menu, Package, ShoppingCart, Users, SettingsIcon, Search, CircleUser, LogOut } from "lucide-react";
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
export default function Header (){
    const pathname = usePathname();

    const links = [
        { href: "/dashboard", icon: Home, label: "Dashboard", badgeCount: 0 },
        { href: "/dashboard/etats", icon: Package, label: "États de Besoins", badgeCount: 6 },
        { href: "/dashboard/employes", icon: Users, label: "Employés", badgeCount: 0 },
        { href: "/dashboard/commandes", icon: ShoppingCart, label: "Commandes", badgeCount: 0 },
        { href: "/dashboard/parametres", icon: SettingsIcon, label: "Paramètres", badgeCount: 0 }
    ];
    return(
        <header className="absolute sticky w-full z-10 backdrop-blur-sm top-0 flex h-14 gap-4 items-center border-b bg-muted/60 px-4 lg:h-[60px] lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <nav className="grid gap-2 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold pb-3"
              >
                <CustomLogoSVG width="2rem" height="2rem" />
                Touba-Achat™
              </Link>
              {links.map((link, index) => (

                <Link 
                    href={link.href}
                    key={index} 
                    className={clsx(
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2",
                        {
                            "bg-muted text-foreground hover:text-foreground": pathname === link.href,
                            "text-muted-foreground hover:text-foreground": pathname !== link.href,
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
              <Card>
                <CardHeader>
                  <CardTitle>Documentation</CardTitle>
                  <CardDescription>
                  Accedez à la documentation de cette application en cliquant içi.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full">
                    Github
                  </Button>
                </CardContent>
              </Card>
            </div>
          </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
          <form>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Recherche..."
                className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
              />
            </div>
          </form>
        </div>
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/03.png" alt="@shadcn" />
                <AvatarFallback>PF</AvatarFallback>
            </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Paul Flan</p>
                <p className="text-xs leading-none text-muted-foreground">
                paul.flan@touba-oil.com
                </p>
            </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
            <DropdownMenuItem>
                Profil           
            </DropdownMenuItem>
            <DropdownMenuItem>
                Aide
            </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <Link href={"/auth"}>
            <DropdownMenuItem>
              Déconnexion
            
            <DropdownMenuShortcut><LogOut className="h-4 w-4" /></DropdownMenuShortcut>
            </DropdownMenuItem>
            </Link>
        </DropdownMenuContent>
        </DropdownMenu>
      </header>
    );
}