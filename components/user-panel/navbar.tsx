import { ModeToggle } from "./mode-toggle";
import { UserNav } from "@/components/user-panel/user-nav";
import { SheetMenu } from "@/components/user-panel/sheet-menu";
import { NotificationCenter } from "../NotificationCenter";
import { CommandMenu } from "../command-menu";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 border-b backdrop-blur ">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0 gap-3">
          <SheetMenu />
          <div className="w-full flex-1">
            <CommandMenu />
          </div>
          {/* <h1 className="font-bold">{title}</h1> */}
        </div>
        <div className="flex flex-1 items-center space-x-2 justify-end gap-2">
          <NotificationCenter />
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
