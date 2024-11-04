import Link from "next/link";
import { PanelsTopLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/user-panel/menu";
import { useSidebarToggle } from "@/hooks/use-sidebar-toggle";
import { SidebarToggle } from "@/components/user-panel/sidebar-toggle";
import CustomLogoSVG from "../logos/CustomLogoSVG";

export function Sidebar() {
  const sidebar = useStore(useSidebarToggle, (state) => state);
  
  if(!sidebar) return null;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        sidebar?.isOpen === false ? "w-[90px]" : "w-72"
      )}
    >
      <SidebarToggle isOpen={sidebar?.isOpen} setIsOpen={sidebar?.setIsOpen} />
      <div className="relative h-full flex flex-col px-3 py-4 overflow-y-auto border-r ">
        <div
          className={cn(
            "flex flex-row items-center px-3 transition-transform ease-in-out duration-300 mb-1 bg-opacity-0",
            sidebar?.isOpen === false ? "translate-x-1" : "translate-x-0"
          )}

        >
          <Link href="/acceuil" className="flex items-center gap-1 ">
          <CustomLogoSVG width="2rem" height="2rem" color="#0A8537" />
            <h1
              className={cn(
                "text-lg font-bold whitespace-nowrap hover:no-underline transition-[transform,opacity,display] ease-in-out duration-300",
                sidebar?.isOpen === false
                  ? "-translate-x-96 opacity-0 hidden"
                  : "translate-x-0 opacity-100"
              )}
            >
              ToubaApp™
            </h1>
          </Link>
        </div>
        <Menu isOpen={sidebar?.isOpen} />
      </div>
    </aside>
  );
}
