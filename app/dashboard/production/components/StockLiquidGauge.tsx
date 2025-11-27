'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface StockLiquidGaugeProps {
  value: number;
  capacity: number;
  title: string;
  subtitle?: string;
  size?: number;
}

export default function StockLiquidGauge({
  value,
  capacity,
  title,
  subtitle,
  size = 150,
}: StockLiquidGaugeProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const percentage = capacity > 0 ? (value / capacity) * 100 : 0;

  // Animate the fill on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  // Determine color based on fill level
  const getColor = (percent: number) => {
    if (percent < 30) return '#ef4444'; // red
    if (percent < 70) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

  const fillColor = getColor(percentage);
  const displayPercentage = Math.round(percentage);

  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          {/* Custom liquid gauge */}
          <div
            className="relative rounded-full border-4 border-gray-300 dark:border-gray-700 overflow-hidden"
            style={{ width: size, height: size }}
          >
            {/* Liquid fill with wave animation */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
              style={{
                height: `${animatedPercentage}%`,
                backgroundColor: fillColor,
                opacity: 0.7,
              }}
            >
              {/* Wave effect using pseudo-element animation */}
              <div
                className="absolute top-0 left-0 right-0 h-8 animate-wave"
                style={{
                  backgroundColor: fillColor,
                  opacity: 0.5,
                }}
              />
            </div>

            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center z-10">
                <span
                  className="text-4xl font-bold"
                  style={{
                    color: animatedPercentage > 50 ? '#ffffff' : '#374151',
                    textShadow: animatedPercentage > 50 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {displayPercentage}
                </span>
                <span
                  className="text-xl font-semibold ml-1"
                  style={{
                    color: animatedPercentage > 50 ? '#ffffff' : '#374151',
                    textShadow: animatedPercentage > 50 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center space-y-1">
          <p className="text-2xl font-bold">
            {value.toFixed(2)} T
          </p>
          <p className="text-xs text-muted-foreground">
            Capacité: {capacity.toFixed(2)} T
          </p>
        </div>

        {/* Add wave animation styles */}
        <style jsx>{`
          @keyframes wave {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-wave {
            animation: wave 3s ease-in-out infinite;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
