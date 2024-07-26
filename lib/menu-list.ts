import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Package2
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
          active: pathname.includes("/"),
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "États de Besoins",
      menus: [
        {
          href: "/etats-de-besoins",
          label: "Liste",
          active: pathname.includes("/tags"),
          icon: Package2,
          submenus: []
        },
        {
          href: "/etats-de-besoins/nouveau",
          label: "Nouveau",
          active: pathname.includes("/categories"),
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
