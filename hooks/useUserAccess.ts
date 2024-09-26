import { useState, useEffect } from 'react';
import { Access } from '@prisma/client';

export function useUserAccess() {
  const [access, setAccess] = useState<Access[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/access');
        if (response.ok) {
          const data = await response.json();
          setAccess(data.access);
        } else {
          setError('Failed to fetch user access');
        }
      } catch (error) {
        console.error('Error fetching user access:', error);
        setError('An error occurred while fetching user access');
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, []);

  return { access, loading, error };
}