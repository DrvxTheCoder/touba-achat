import { useState, useEffect } from 'react';
import { EDB } from '../data-two/data';

interface PaginatedEDBs {
  edbs: EDB[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const useEDBs = (page: number, pageSize: number, searchTerm: string, statusFilter: string[]) => {
  const [paginatedData, setPaginatedData] = useState<PaginatedEDBs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEDBs = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: searchTerm,
          status: statusFilter.join(',')
        });
        const response = await fetch(`/api/edb?${queryParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch EDAs');
        }
        const data: PaginatedEDBs = await response.json();
        setPaginatedData(data);
      } catch (err) {
        setError('An error occurred while fetching EDAs');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEDBs();
  }, [page, pageSize, searchTerm, statusFilter]);

  return { paginatedData, isLoading, error };
};