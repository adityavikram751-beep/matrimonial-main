import React, { useState, useEffect } from 'react';
import SubAdminTable from './SubAdminTable';
import SubAdminRemoveModal from './SubAdminRemoveModal';
import SubAdminViewModal from './SubAdminViewModal';
import SummaryCards from './SummaryCards';

// API base URL – adjust if needed
const API_BASE = 'https://merimonial-backend.onrender.com';

// Helper to get auth headers (adjust token key as per your app)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // or 'authToken', etc.
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const SubAdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [removeId, setRemoveId] = useState(null);

  // Transform API admin to UI format
  const transformAdmin = (apiAdmin, uiStatus) => ({
    ...apiAdmin,
    id: apiAdmin._id,
    status: uiStatus, // 'Active' or 'Suspended'
    lastActive: apiAdmin.updatedAt
      ? new Date(apiAdmin.updatedAt).toLocaleDateString()
      : new Date(apiAdmin.createdAt).toLocaleDateString(),
    // Ensure the following fields are present (if missing, provide defaults)
    firstName: apiAdmin.firstName || '',
    lastName: apiAdmin.lastName || '',
    email: apiAdmin.email || '',
    role: apiAdmin.role || '',
    profileImage: apiAdmin.profileImage || null,
  });

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const headers = getAuthHeaders();

        // Fetch active and inactive in parallel
        const [activeRes, inactiveRes] = await Promise.all([
          fetch(`${API_BASE}/api/sub-admin/filter/sub-admin/active`, { headers }),
          fetch(`${API_BASE}/api/sub-admin/filter/sub-admin/inactive`, { headers }),
        ]);

        if (!activeRes.ok || !inactiveRes.ok) {
          if (activeRes.status === 401 || inactiveRes.status === 401) {
            throw new Error('Authentication required. Please log in again.');
          }
          throw new Error('Failed to fetch sub‑admins');
        }

        const activeData = await activeRes.json();
        const inactiveData = await inactiveRes.json();

        if (!activeData.success || !inactiveData.success) {
          throw new Error(activeData.message || inactiveData.message || 'API error');
        }

        const activeAdmins = (activeData.response || []).map(admin =>
          transformAdmin(admin, 'Active')
        );
        const inactiveAdmins = (inactiveData.response || []).map(admin =>
          transformAdmin(admin, 'Suspended')
        );

        setAdmins([...activeAdmins, ...inactiveAdmins]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubAdmins();
  }, []);

  // Handler for adding a new sub‑admin
  const handleAdd = async (newAdmin) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/sub-admin`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newAdmin),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create sub-admin');
      }

      const created = data.response;
      const uiStatus = created.status === 'active' ? 'Active' : 'Suspended';
      const transformed = transformAdmin(created, uiStatus);
      setAdmins(prev => [...prev, transformed]);
    } catch (err) {
      console.error('Add error:', err);
      // Optionally show an error toast/notification
    }
  };

  // Handler for removing a sub‑admin
  const handleRemove = async () => {
    if (!removeId) return;
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/sub-admin/${removeId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete sub-admin');
      }

      setAdmins(prev => prev.filter(admin => admin.id !== removeId));
      setRemoveId(null);
    } catch (err) {
      console.error('Delete error:', err);
      // Optionally show an error message
    }
  };

  // Derived counts for summary cards
  const active = admins.filter(a => a.status === 'Active');
  const suspended = admins.filter(a => a.status === 'Suspended');

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="text-center text-red-500 p-4 border rounded-xl bg-red-50 m-4">
        Error loading sub‑admins: {error}
      </div>
    );
  }

  // Render same UI as original, but with real data
  return (
    <>
      <div className="flex gap-2 justify-around p-4 flex-wrap">
        <SummaryCards
          title="Total Sub Admin"
          count={admins.length}
          users={admins}
          borderColor="border-gray-400"
        />
        <SummaryCards
          title="Active Sub Admin"
          count={active.length}
          users={active}
          borderColor="border-green-500"
        />
        <SummaryCards
          title="Suspended Sub Admin"
          count={suspended.length}
          users={suspended}
          borderColor="border-red-500"
        />
      </div>

      <div className="p-18">
        <SubAdminTable
          data={admins}
          onView={(admin) => setViewData(admin)}
          onRemove={(id) => setRemoveId(id)}
          onAdd={handleAdd}
        />
      </div>

      {viewData && (
        <SubAdminViewModal data={viewData} onClose={() => setViewData(null)} />
      )}

      {removeId && (
        <SubAdminRemoveModal
          onConfirm={handleRemove}
          onCancel={() => setRemoveId(null)}
          user={admins.find((a) => a.id === removeId)}
        />
      )}
    </>
  );
};

export default SubAdminPage;