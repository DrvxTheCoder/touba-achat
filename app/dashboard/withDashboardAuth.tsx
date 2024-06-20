// app/dashboard/withDashboardAuth.tsx

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const withDashboardAuth = (WrappedComponent: React.ComponentType) => {
  return (props: any) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'unauthenticated') {
        router.replace('/auth');
      }
    }, [status, router]);

    if (status === 'loading') {
      return <div>Chargement...</div>; // Show a loading indicator while checking session status
    }

    return <WrappedComponent {...props} />;
  };
};

export default withDashboardAuth;
