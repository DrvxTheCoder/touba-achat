"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAllowedRoles } from "@/app/hooks/use-allowed-roles"
import clsx from "clsx";
import CustomLogoSVG from "@/components/logos/CustomLogoSVG";
import { Home, Package, ShoppingCart, Users, SettingsIcon, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ClientSidebar(){
    const pathname = usePathname();
    const { data: session } = useSession();
    const { hasReadAccess, hasWriteAccess } = useAllowedRoles();

    const links = [
        { href: "/edb", icon: Home, label: "Acceuil", badgeCount: 0 },
        { href: "/edb/nouveau", icon: Package, label: "Mes EDBs", badgeCount: 6 },
        { href: "/edb/commandes", icon: ShoppingCart, label: "Commandes", badgeCount: 0 },
    ];

    const isLinkActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard"; // Dashboard is active only on exact match
        }
        return pathname.startsWith(href); // Other links are active on nested routes
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-4">
        <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
            <div className="flex items-center gap-1">
                <CustomLogoSVG width="2rem" height="2rem" />
                <Link href="/">Touba-App™</Link>
            </div>
        </Link>
        <TooltipProvider>
            {links.map((link, index) => (
                    <Tooltip>
                        <TooltipTrigger asChild>
                        <Link
                            key={index} 
                            href={link.href} 
                            className={clsx(
                                "flex h-9 w-9 items-center justify-center rounded-lg hover:text-foreground md:h-8 md:w-8",
                                {
                                    "bg-accent text-accent-foreground shadow-sm": isLinkActive(link.href),
                                    "text-muted-foreground": !isLinkActive(link.href),
                                }
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{link.label}</TooltipContent>
                    </Tooltip>

                ))}
            </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-4">
            <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <Link
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
            </TooltipProvider>

        </nav>
        </aside>
    );
}

