// 12. hooks/useUsers.js (Custom hook for user management)
import { useState, useEffect } from 'react';
import api from '@/utils/api';

export const useUsers = (initialFilters = {}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const fetchUsers = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/users', {
        params: { ...initialFilters, ...filters }
      });
      
      setUsers(response.data.users);
      setPagination({
        page: response.data.page,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    fetchUser,
    refetch: () => fetchUsers()
  };
};