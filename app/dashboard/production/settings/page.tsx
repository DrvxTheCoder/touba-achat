'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Cylinder,
  Building2,
  Package,
  ChevronRight,
  Settings,
} from 'lucide-react';

interface SettingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function SettingCard({ title, description, icon, href, color }: SettingCardProps) {
  const router = useRouter();

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all duration-200 border shadow-sm overflow-hidden"
      onClick={() => router.push(href)}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-5">
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductionSettingsPage() {
  const router = useRouter();

  const settings: SettingCardProps[] = [
    {
      title: 'Types de bouteilles',
      description: 'Gérer les types de bouteilles GPL et leurs poids',
      icon: <Package className="h-6 w-6 text-blue-600" />,
      href: '/dashboard/production/settings/bottle-types',
      color: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Centres de production',
      description: 'Configurer les centres et leurs responsables',
      icon: <Building2 className="h-6 w-6 text-green-600" />,
      href: '/dashboard/production/settings/centers',
      color: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Réservoirs GPL',
      description: 'Gérer les réservoirs et leurs capacités',
      icon: <Cylinder className="h-6 w-6 text-orange-600" />,
      href: '/dashboard/production/settings/reservoirs',
      color: 'bg-orange-100 dark:bg-orange-950',
    },
  ];

  return (
    <div className="container flex flex-col justify-center items-center mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-12 w-full">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/production')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Paramètres</h1>
            <p className="text-sm text-muted-foreground">
              Configuration du module GPL
            </p>
          </div>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="space-y-3 max-w-3xl w-full">
        {settings.map((setting) => (
          <SettingCard key={setting.href} {...setting} />
        ))}
      </div>
    </div>
  );
}
