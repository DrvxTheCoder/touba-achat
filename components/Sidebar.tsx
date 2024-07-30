"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useAllowedRoles } from "@/app/hooks/use-allowed-roles"
import clsx from "clsx";
import CustomLogoSVG from "@/components/logos/CustomLogoSVG";
import { Home, Package, ShoppingCart, Users, SettingsIcon, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Sidebar(){
    const pathname = usePathname();
    const { data: session } = useSession();
    const { hasReadAccess, hasWriteAccess } = useAllowedRoles();

    const links = hasReadAccess ? [
        { href: "/dashboard", icon: Home, label: "Dashboard", badgeCount: 0 },
        { href: "/dashboard/etats", icon: Package, label: "États de Besoins", badgeCount: 6 },
        { href: "/dashboard/employes", icon: Users, label: "Employés", badgeCount: 0 },
        { href: "/dashboard/commandes", icon: ShoppingCart, label: "Commandes", badgeCount: 0 },
        { href: "/dashboard/parametres", icon: SettingsIcon, label: "Paramètres", badgeCount: 0 }
    ] : [
        { href: "/dashboard", icon: Home, label: "Dashboard", badgeCount: 0 },
        { href: "/dashboard/mes-edbs", icon: Package, label: "Mes EDBs", badgeCount: 6 },
        { href: "/dashboard/commandes", icon: ShoppingCart, label: "Commandes", badgeCount: 0 },
        { href: "/dashboard/parametres", icon: SettingsIcon, label: "Paramètres", badgeCount: 0 }
    ];

    const isLinkActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard"; // Dashboard is active only on exact match
        }
        return pathname.startsWith(href); // Other links are active on nested routes
    };

    return (
        <aside className="absolute sticky left-0 h-full hidden border-r lg:block">
            <div className="fixed flex h-full max-h-screen flex-col gap-2 w-[17.5rem]">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <div className="flex items-center gap-2 font-semibold space-x-9">
                        <div className="flex items-center gap-1">
                            <CustomLogoSVG width="2rem" height="2rem" />
                            <Link href="/">Touba-App™</Link>
                        </div>
                    </div>
                </div>
                <div className="flex">
                    <nav className="grid items-start px-2 pt-4 text-sm font-medium lg:px-4 w-full">
                        {links.map((link, index) => (
                            <Link
                                key={index} 
                                href={link.href} 
                                className={clsx(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 my-1 transition-all hover:bg-muted/50",
                                    {
                                        "bg-muted/50 text-primary shadow-sm": isLinkActive(link.href),
                                        "text-muted-foreground": !isLinkActive(link.href),
                                    }
                                )}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                                {link.badgeCount > 0 && (
                                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                        {link.badgeCount} 
                                    </Badge>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-4 w-full">
                <Button onClick={() => signOut()} variant="outline" className="w-full justify-center h-10 mt-5">
                    <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </Button>
                    {/* <Card x-chunk="dashboard-02-chunk-0">
                        <CardHeader className="p-3 pt-0 md:p-4">
                            <CardTitle>Feedback</CardTitle>
                            <CardDescription className="w-full">
                                Votre opinion compte! N&apos;hesitez pas à donner votre avis sur l&apos;appli.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                            <Button size="sm" className="w-full">
                                Donner un avis
                            </Button>
                        </CardContent>
                    </Card> */}
                </div>
            </div>
        </aside>
    );
}