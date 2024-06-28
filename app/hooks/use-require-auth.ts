// hooks/useRequireAuth.js
// This hook will redirect users to the login page if they are not authenticated.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; // Assuming you're using next-auth

export default function useRequireAuth(redirectUrl = '/auth') {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const isAuthenticated = !!session;
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login or any specified URL
      router.push(redirectUrl);
    }
  }, [isAuthenticated, loading, redirectUrl, router]);

  return { isAuthenticated, loading };
}