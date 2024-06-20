"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react'; // Assuming you're using NextAuth for authentication

const HomeRedirect: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      if (!session) {
        router.replace('/auth'); // Redirect to the authentication page if the user is not authenticated
      } else {
        router.replace('/dashboard'); // Redirect to the dashboard if the user is authenticated
      }
    };
    
    fetchSession();
  }, [router]);

  return null; // Since this component is only used for redirection, it doesn't need to render anything
}

export default HomeRedirect;
