import Link from "next/link";
import { MenuIcon, PanelsTopLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu } from "@/components/user-panel/menu";
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
// import CustomLogoSVG from "../logos/CustomLogoSVG";
import CustomLogoSVG from "../logos/CustomLogoSVG";


export function SheetMenu() {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button className="h-8" variant="outline" size="icon">
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <Button
            className="flex justify-center items-center pb-2 pt-1"
            variant="ghost"
            asChild
          >
            <Link href="/acceuil" className="flex items-center gap-2">
            <div className="flex flex-row gap-2">
            <CustomLogoSVG width="1rem" height="auto" color="#0A8537" />
            <text className="font-black">Touba-App™</text>
            </div>

            </Link>
          </Button>
        </SheetHeader>
        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
}
