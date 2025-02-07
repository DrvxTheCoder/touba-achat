// useEDBs.ts
import { useState, useEffect, useCallback } from 'react';
import { EDBStatus, EDB } from '@/app/(utilisateur)/etats-de-besoin/data/types';

interface PaginatedEDBs {
  edbs: EDB[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface UserInfo {
  role: string;
}

// useEDBs.ts
export const useEDBs = (
  page: number, 
  pageSize: number, 
  searchTerm: string, 
  statusFilter: string[],
  userInfo: UserInfo,
  timeRange: string,  // Added parameter
) => {
  const [paginatedData, setPaginatedData] = useState<PaginatedEDBs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEDB, setSelectedEDB] = useState<EDB | null>(null);

  const fetchEDBs = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
        role: userInfo.role,
        timeRange: timeRange // Add timeRange to query params
      });
      const response = await fetch(`/api/edb?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch EDAs');
      }
      const data: PaginatedEDBs = await response.json();
      setPaginatedData(data);
    } catch (err) {
      setError('Erreur lors de la récupération des données');
      console.error(err);
    } finally {
      setIsLoading(false);
      setSelectedEDB(null);
    }
  }, [page, pageSize, searchTerm, statusFilter, userInfo.role, timeRange]); // Add timeRange to dependencies

  useEffect(() => {
    fetchEDBs();
  }, [fetchEDBs]);

  return { paginatedData, isLoading, error, refetch: fetchEDBs, selectedEDB, setSelectedEDB };
};