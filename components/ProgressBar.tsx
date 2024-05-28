"use client"
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  pathname: string; // Accept pathname as prop
}

const ProgressBar: React.FC<ProgressBarProps> = ({ pathname }) => {
  const [progress, setProgress] = useState(0);

  // Implement progress logic based on pathname
  useEffect(() => {
    // Your progress logic here
  }, [pathname]);

  return progress > 0 ? (
    <div className="fixed top-14 left-0 right-0 z-50">
      <Progress value={progress} className="w-full" />
    </div>
  ) : null;
};

export default ProgressBar;
