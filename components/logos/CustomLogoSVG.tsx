import React from 'react';

interface CustomSVGProps {
  width?: string;
  height?: string;
  color?: string;  // Optional color prop to change the color dynamically
  className?: string;
}

const CustomLogoSVG: React.FC<CustomSVGProps> = ({
  width = '100%',
  height = '100%',
  color = 'currentColor',  // Default to currentColor, which inherits color from parent
  className = ''
}) => {
  return (
    <svg
      id="Layer_2"
      data-name="Layer 2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 43.1 55.83"
      width={width}
      height={height}
      className={className}
      style={{ color }}
    >
      <g id="Layer_1-2" data-name="Layer 1" fill="currentColor">
        <path d="M32.89,33.81c-4.64-.86-10.2-1.55-16.48-1.67-6.23-.12-11.76,.35-16.41,1.02,4.77-1.7,11.87-3.63,20.62-3.89,9.62-.29,17.42,1.55,22.48,3.16-2.18,.86-4.79,2.21-7.35,4.37-7.86,6.64-9.37,16.01-9.72,19.02-.14-2.64-.06-6.79,1.43-11.58,1.5-4.84,3.81-8.34,5.43-10.44Z" />
        <path d="M22.72,0c.19,.84,.54,2.13,1.16,3.64,.92,2.24,1.43,2.96,1.79,4.43,.26,1.07,.44,2.65-.05,4.76h-6.31c-.40-2.05-.16-3.75,.14-4.76,.47-1.59,1.19-2.34,2.09-4.43,.65-1.52,1-2.76,1.18-3.64Z" />
        <path d="M11.69,20.68c6-6.5,16.59-5.55,21.81,.11-7.38-2.22-14.37-2.24-21.81-.11Z" />
        <path d="M5.29,27.95c1.7-1.31,8.34-6.11,17.8-5.51,7.64,.49,12.84,4.22,14.73,5.72-3.94-1.07-9.17-2.09-15.37-2.22-7.02-.14-12.9,.9-17.16,2Z" />
      </g>
    </svg>
  );
};

export default CustomLogoSVG;
