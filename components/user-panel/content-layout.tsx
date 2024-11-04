import { Navbar } from "@/components/user-panel/navbar";
import { ScrollArea } from "../ui/scroll-area";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} />
      <ScrollArea className="px-3 md:h-[52rem]">
      {children}
      </ScrollArea>
    </div>
  );
}
