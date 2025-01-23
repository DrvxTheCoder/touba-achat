import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Types for our metrics
type MetricCardProps = {
  title: string;
  value: number | undefined;
  description?: string;
  action?: React.ReactNode;
  icon: React.ReactNode;
}

type CardActionButtonProps = {
  title: string;
  action: React.ReactNode;
}

export const MetricCard = ({ title, value, description, icon, action }: MetricCardProps) => (
  <Card className="flex items-center min-h-32 rounded-2xl">
    <CardContent className="flex flex-row justify-between items-center p-3 px-6 gap-2 w-full">
      <div className="flex flex-row items-center gap-4 md:gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border">
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <h5 className="text-sm font-semibold leading-5">
            {title}
          </h5>
          <p className="mt-1 text-2xl font-bold leading-6">
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>
      <div className="flex">
        {action}
      </div>
    </CardContent>
  </Card>
);

export const CardActionButton = ({ title, action }: CardActionButtonProps) => (
  <Card className="flex items-center min-h-32 rounded-2xl">
    <CardContent className="flex flex-row justify-between items-center p-3 px-6 gap-2 w-full">
      <div className="flex flex-row items-center gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <p className="mt-1 text-lg font-bold leading-6">
            {title}
          </p>
        </div>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-full border hover:bg-primary hover:text-white cursor-pointer">
        {action}
      </div>
    </CardContent>
  </Card>
);