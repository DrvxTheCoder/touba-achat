import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from "lucide-react";
import { SpinnerCircular } from 'spinners-react';

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

interface ErrorCardProps {
  message?: string;
  className?: string;
}

interface LoadingCardProps {
  isLoadingTitle: string;
}

export function ErrorCard({ 
  message = "Une erreur s'est produite lors du calcul des métriques.", 
  className 
}: ErrorCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-center text-muted-foreground">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

export function LoadingCard({ isLoadingTitle }: LoadingCardProps) {
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
        <div className="items-center justify-center">
          <SpinnerCircular size={40} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
        </div>
      </CardContent>
    </Card>
  );
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