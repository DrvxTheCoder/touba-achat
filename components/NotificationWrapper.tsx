// components/NotificationWrapper.tsx
"use client"

import { useState, useEffect } from 'react';
import { NotificationCenter } from './NotificationCenter';

let notificationInstanceExists = false;

export function NotificationWrapper() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!notificationInstanceExists) {
      notificationInstanceExists = true;
      setShouldRender(true);
    }

    return () => {
      notificationInstanceExists = false;
    };
  }, []);

  if (!shouldRender) return null;
  return <NotificationCenter />;
}