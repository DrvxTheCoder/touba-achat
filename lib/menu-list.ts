// lib/menu-list.ts
import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  Package2,
  Home,
  LucideIcon,
  Package,
  Luggage,
  PenBoxIcon,
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  submenus: Submenu[];
};

type Group = {
  groupLabel?: string;
  menus: Menu[];
};

export function getAdminMenuList(pathname: string): Group[] {
  return [
    {
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          active: pathname === "/dashboard",
          icon: LayoutGrid,
          submenus: []
        },
        {
          href: "/acceuil",
          label: "Accueil",
          active: pathname.includes("/acceuil"),
          icon: Home,
          submenus: []
        },
        {
          href: "/dashboard/etats",
          label: "États de Besoins",
          active: ["/dashboard/etats", "/etats-de-besoin", "/dashboard/etats/stock", "/dashboard/etats/EDB-"].includes(pathname),
          icon: Package,
          submenus: []
        },
        {
          href: "/dashboard/odm",
          label: "Ordres de Mission",
          active: pathname.includes("/dashboard/odm"),
          icon: Luggage,
          submenus: []
        },
        {
          href: "/dashboard/employes",
          label: "Employés / Utilisateur",
          active: pathname.includes("/dashboard/employes"),
          icon: Users,
          submenus: []
        },
      ]
    },
  ];
}

export function getUserMenuList(pathname: string): Group[] {
  return [
    {
      menus: [
        {
          href: "/acceuil",
          label: "Accueil",
          active: pathname === "/acceuil",
          icon: Home,
          submenus: []
        },
        {
          href: "/etats-de-besoin",
          label: "États de Besoins",
          active: pathname.includes("/etats-de-besoin"),
          icon: Package,
          submenus: []
        }
      ]
    },
  ];
}