import { Navbar } from "@/components/user-panel/navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} />
      <div className="pt-8 pb-5 px-3 md:px-24">{children}</div>
    </div>
  );
}
