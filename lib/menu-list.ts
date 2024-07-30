import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Package2,
  Home
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
  icon: LucideIcon
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/acceuil",
          label: "Acceuil",
          active: pathname.includes("/acceuil"),
          icon: Home,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "États de Besoins",
      menus: [
        {
          href: "/etats-de-besoin",
          label: "Liste",
          active: pathname === "/etats-de-besoin",
          icon: Package2,
          submenus: []
        },
        {
          href: "/etats-de-besoin/nouveau",
          label: "Nouveau",
          active: pathname === "/etats-de-besoin/nouveau",
          icon: SquarePen,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Paramètres",
      menus: [
        {
          href: "/account",
          label: "Mon compte",
          active: pathname.includes("/account"),
          icon: Settings,
          submenus: []
        }
      ]
    }
  ];
}
