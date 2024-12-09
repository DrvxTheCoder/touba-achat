"use client"

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight } from 'lucide-react';

// Define a mapping of path segments to display names
const pathMap: { [key: string]: string } = {
  dashboard: 'Tableau de bord',
  employes: 'Employés',
  etats: 'États de Besoins',
  parametres: 'Paramètres',
  nouveau: 'Nouveau',
  odm: 'Ordres de Missions',
  stock: 'Articles en stock',
  acceuil: 'Accueil',
  "etats-de-besoin":'Mes États de Besoins',
  bdc: 'Bon de caisse'
  // Add more mappings as needed
};

function generateBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  let currentPath = '';

  return paths.map((path, index) => {
    currentPath += `/${path}`;
    const isLast = index === paths.length - 1;

    return {
      href: currentPath,
      label: pathMap[path] || path,
      isLast
    };
  });
}

export default function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or null when not mounted
    return (
      <Breadcrumb className='p-4 px-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className='text-xs'>Accueil</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <Breadcrumb className='p-4 px-6'>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/acceuil" className='text-xs'>Accueil</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className='text-xs'>{crumb.label}</BreadcrumbPage>
              ) : (
                <Link href={crumb.href} passHref legacyBehavior>
                  <BreadcrumbLink className='text-xs'>{crumb.label}</BreadcrumbLink>
                </Link>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}