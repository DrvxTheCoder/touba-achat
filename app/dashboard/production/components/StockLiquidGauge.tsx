'use client';

import { color } from 'd3-color';
import { interpolateRgb } from 'd3-interpolate';
import LiquidFillGauge from 'react-liquid-gauge';
import { Card, CardContent } from '@/components/ui/card';

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
  const percentage = capacity > 0 ? (value / capacity) * 100 : 0;

  // Color gradient based on fill level
  const startColor = '#10b981'; // green
  const midColor = '#f59e0b'; // orange
  const endColor = '#ef4444'; // red

  // Interpolate colors based on percentage
  let fillColor: string;
  if (percentage <= 50) {
    const interpolate = interpolateRgb(startColor, midColor);
    fillColor = interpolate(percentage / 50);
  } else {
    const interpolate = interpolateRgb(midColor, endColor);
    fillColor = interpolate((percentage - 50) / 50);
  }

  const gradientStops = [
    {
      key: '0%',
      stopColor: color(fillColor).darker(0.5).toString(),
      stopOpacity: 1,
      offset: '0%',
    },
    {
      key: '50%',
      stopColor: fillColor,
      stopOpacity: 0.75,
      offset: '50%',
    },
    {
      key: '100%',
      stopColor: color(fillColor).brighter(0.5).toString(),
      stopOpacity: 0.5,
      offset: '100%',
    },
  ];

  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col items-center">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <LiquidFillGauge
            style={{ margin: '0 auto' }}
            width={size}
            height={size}
            value={percentage}
            percent="%"
            textSize={1}
            textOffsetX={0}
            textOffsetY={0}
            textRenderer={(props) => {
              const percentValue = Math.round(props.value);
              const radius = Math.min(props.height / 2, props.width / 2);
              const textPixels = (props.textSize * radius / 2);
              const valueStyle = {
                fontSize: textPixels,
              };
              const percentStyle = {
                fontSize: textPixels * 0.6,
              };

              return (
                <tspan>
                  <tspan className="value" style={valueStyle}>
                    {percentValue}
                  </tspan>
                  <tspan style={percentStyle}>{props.percent}</tspan>
                </tspan>
              );
            }}
            riseAnimation
            waveAnimation
            waveFrequency={2}
            waveAmplitude={1}
            gradient
            gradientStops={gradientStops}
            circleStyle={{
              fill: fillColor,
            }}
            waveStyle={{
              fill: fillColor,
            }}
            textStyle={{
              fill: color('#444').toString(),
              fontFamily: 'Arial',
            }}
            waveTextStyle={{
              fill: color('#fff').toString(),
              fontFamily: 'Arial',
            }}
          />
        </div>

        <div className="mt-4 text-center space-y-1">
          <p className="text-2xl font-bold">
            {value.toFixed(2)} T
          </p>
          <p className="text-xs text-muted-foreground">
            Capacité: {capacity.toFixed(2)} T
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
