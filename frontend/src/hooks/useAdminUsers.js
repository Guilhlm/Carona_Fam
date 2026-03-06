import { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminService from '../services/adminService';

export function useAdminUsers() {
  const [result, setResult] = useState({ data: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBlocked, setFilterBlocked] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      isBlocked:
        filterBlocked === 'true'
          ? true
          : filterBlocked === 'false'
          ? false
          : undefined,
      role: filterRole || undefined,
    }),
    [page, search, filterBlocked, filterRole]
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listUsers(queryParams);
      setResult({
        data: res.data || [],
        pagination: res.pagination || {},
      });
    } catch (err) {
      setResult({ data: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = useCallback(
    (event) => {
      if (event) event.preventDefault();
      setPage(1);
    },
    [setPage]
  );

  const handleBlock = useCallback(
    async (userId, block) => {
      try {
        await adminService.blockUser(userId, block);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao bloquear');
      }
    },
    [fetchUsers]
  );

  const handleToggleAdmin = useCallback(
    async (user, makeAdmin) => {
      try {
        const payload = {};

        if (makeAdmin) {
          payload.role = 'ADMIN';
          payload.isAdmin = true;
        } else {
          if (user.role === 'ADMIN') {
            payload.role = 'USER';
          }
          if (user.isAdmin) {
            payload.isAdmin = false;
          }
        }

        await adminService.updateUser(user.id, payload);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao atualizar permissões');
      }
    },
    [fetchUsers]
  );

  return {
    users: result.data,
    pagination: result.pagination,
    loading,
    page,
    setPage,
    search,
    setSearch,
    filterBlocked,
    setFilterBlocked,
    filterRole,
    setFilterRole,
    handleSearchSubmit,
    handleBlock,
    handleToggleAdmin,
  };
}