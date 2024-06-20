import { useSession, signIn, SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import React from 'react';

const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === 'loading') return; // Do nothing while loading
      if (!session) signIn(); // Redirect to sign in page if not authenticated
    }, [session, status]);

    if (status === 'loading') {
      return <div>Loading...</div>;
    }

    return (
      <SessionProvider session={session}>
        <WrappedComponent {...props} session={session} />
      </SessionProvider>
    );
  };
};

export default withAuth;