import Link from "next/link";

import PlaceholderContent from "../components/placeholder";
import { ContentLayout } from "@/components/user-panel/content-layout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function EtatsDeBesoinPage() {
  return (
    <ContentLayout title="Etats de Besoins">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Acceuil</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Etats de Besoins</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div>
          <div className="flex items-center justify-between space-y-2">
              <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline">Nouveau <PlusCircle className="ml-2 h-4 w-4"/></Button>
              </div>
          </div>
        </div>
      </main>
    </ContentLayout>
  );
}
