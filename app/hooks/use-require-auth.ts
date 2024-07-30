// hooks/useRequireAuth.ts
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

export default function useRequireAuth(allowedRoles?: Role[]) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push('/auth');
      } else if (allowedRoles && !allowedRoles.includes(session.user.role)) {
        // Redirect to an unauthorized page or the appropriate route based on the user's role
        if (session.user.isSimpleUser) {
          router.push('/acceuil');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [session, loading, router, allowedRoles]);

  return { session, loading };
}