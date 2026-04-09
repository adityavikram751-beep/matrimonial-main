import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaChevronDown, FaPlus } from 'react-icons/fa';

const API_URL = 'https://merimonial-backend.onrender.com';

// ✅ Master list of all available permissions (same as in CreateSubAdminModal)
const MASTER_PERMISSIONS = [
  { key: 'DASHBOARD', label: 'Dashboard' },
  { key: 'ANALYTICS', label: 'Analytics' },
  { key: 'MANAGE_USERS', label: 'Manage Users' },
  { key: 'REPORTED_CONTENT', label: 'Reported Content' },
  { key: 'VARIFICATION_REQUEST', label: 'Verification Requests' },
  { key: 'PROFILE_DETAILS', label: 'Profile Details' },
];

const ROLE_SUGGESTIONS = ['reporter', 'moderator', 'verification_officer', 'analyst', 'support', 'backend', 'frontend'];

const RoleInput = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500">
        <input
          type="text"
          placeholder="Type or select role"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm focus:outline-none"
        />
        <button type="button" onClick={() => setOpen((p) => !p)}
          className="px-3 bg-gray-100 border-l border-gray-300 hover:bg-gray-200 transition">
          <FaChevronDown size={11} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
          {ROLE_SUGGESTIONS.map((r) => (
            <button key={r} type="button"
              onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition ${value === r ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-gray-700'}`}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PermCheckbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={onChange}
      className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
    <span className="flex-1">{label}</span>
  </label>
);

const EditModal = ({ data, onClose, onUpdate, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    gender: 'male',
    status: 'active',
    profileImage: null,
    profileImageFile: null,
  });

  // Permissions state: list of currently assigned permission objects
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [selectedPermissionToAdd, setSelectedPermissionToAdd] = useState('');

  const fileInputRef = useRef(null);

  // Initialize form and permissions from props
  useEffect(() => {
    if (data) {
      console.log('Data received in EditModal:', data);
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || '',
        gender: data.gender || 'male',
        status: data.status || 'active',
        profileImage: data.profileImage || null,
        profileImageFile: null,
      });
      
      // Initialize permissions from data.permissions (array of strings or objects)
      if (data.permissions && Array.isArray(data.permissions)) {
        const perms = data.permissions.map(perm => {
          if (typeof perm === 'string') {
            // Find from master list or create a custom object
            const found = MASTER_PERMISSIONS.find(p => p.key === perm);
            if (found) return found;
            return { key: perm, label: perm.replace(/_/g, ' '), isCustom: true };
          }
          return perm;
        });
        setAssignedPermissions(perms);
      } else {
        setAssignedPermissions([]);
      }
    }
  }, [data]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((prev) => ({ ...prev, profileImage: ev.target.result, profileImageFile: file }));
    reader.readAsDataURL(file);
  };

  // Toggle a permission checkbox
  const togglePerm = (permKey) => {
    setAssignedPermissions(prev => {
      const exists = prev.find(p => p.key === permKey);
      if (exists) {
        return prev.filter(p => p.key !== permKey);
      } else {
        // Add from master list
        const master = MASTER_PERMISSIONS.find(p => p.key === permKey);
        if (master) return [...prev, master];
        // If not in master (shouldn't happen), add as custom
        return [...prev, { key: permKey, label: permKey.replace(/_/g, ' ') }];
      }
    });
  };

  // Add permission from dropdown
  const handleAddPermissionFromDropdown = () => {
    if (!selectedPermissionToAdd) return;
    // Check if already assigned
    if (assignedPermissions.some(p => p.key === selectedPermissionToAdd)) {
      setError('Permission already added');
      setTimeout(() => setError(''), 2000);
      return;
    }
    const master = MASTER_PERMISSIONS.find(p => p.key === selectedPermissionToAdd);
    if (master) {
      setAssignedPermissions(prev => [...prev, master]);
    } else {
      // Fallback (should not happen because dropdown only shows master keys)
      setAssignedPermissions(prev => [...prev, { key: selectedPermissionToAdd, label: selectedPermissionToAdd.replace(/_/g, ' ') }]);
    }
    setSelectedPermissionToAdd('');
  };

  // Remove a permission (only custom ones or any permission)
  const handleRemovePermission = (permKey) => {
    setAssignedPermissions(prev => prev.filter(p => p.key !== permKey));
  };

  // Available permissions for dropdown (those not already assigned)
  const availablePermissions = MASTER_PERMISSIONS.filter(
    master => !assignedPermissions.some(assigned => assigned.key === master.key)
  );

  const handleUpdate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.role) {
      setError('Please fill all required fields');
      return;
    }

    setError('');
    setSuccess('');
    setDebugInfo('');
    setLoading(true);

    try {
      // Update profile using FormData
      const fd = new FormData();
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('role', form.role);
      fd.append('gender', form.gender);
      fd.append('status', form.status);
      if (form.profileImageFile) fd.append('profileImage', form.profileImageFile);

      const token = localStorage.getItem('token');
      const updateUrl = `${API_URL}/api/sub-admin/update/sub-admin-profile/${data._id}`;
      
      const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      
      const responseData = await res.json();
      
      if (!res.ok || !responseData.success) {
        setError(responseData.message || 'Update failed');
        setLoading(false);
        return;
      }

      // Update permissions
      const permissionKeys = assignedPermissions.map(p => p.key);
      const permRes = await fetch(`${API_URL}/api/sub-admin/add/tab-permission`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          subAdminId: data._id, 
          permissionTabs: permissionKeys 
        }),
      });
      
      const permData = await permRes.json();
      if (!permRes.ok || !permData.success) {
        console.error('Permission update failed:', permData.message);
        setError('Profile updated but permission update failed');
      } else {
        setSuccess('Profile and permissions updated successfully!');
      }

      if (onRefresh) await onRefresh();
      if (onUpdate) onUpdate();

      setTimeout(() => onClose(), 1000);
      
    } catch (err) {
      console.error('Update error:', err);
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Split assigned permissions into two columns for display
  const col1 = assignedPermissions.filter((_, i) => i % 2 === 0);
  const col2 = assignedPermissions.filter((_, i) => i % 2 !== 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group w-12 h-12">
              <img 
                src={form.profileImage || 'https://via.placeholder.com/48'}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200" 
                alt="avatar" 
              />
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs">📷</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Sub Admin</h2>
              <p className="text-sm text-gray-500">Update profile information</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg"><FaTimes /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">✅ {success}</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
              {debugInfo && <pre className="text-xs text-red-500 mt-1">{debugInfo}</pre>}
            </div>
          )}

          {/* Basic Info Section */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">📝 Basic Information</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone <span className="text-red-500">*</span></label>
                <input type="text" name="phone" value={form.phone} onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                <select name="gender" value={form.gender} onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role <span className="text-red-500">*</span></label>
                <RoleInput value={form.role} onChange={(val) => setForm(prev => ({ ...prev, role: val }))} />
              </div>
            </div>
          </div>

          {/* Permissions Section with Dropdown */}
          <div className="rounded-xl px-4 py-4 bg-amber-50">
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              Assigned Permissions
              <span className="ml-2 text-xs font-normal text-gray-400">({assignedPermissions.length} selected)</span>
            </h3>

            {/* Dropdown to add new permissions */}
            <div className="mb-4 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">➕ Add Permission</label>
                <select
                  value={selectedPermissionToAdd}
                  onChange={(e) => setSelectedPermissionToAdd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Select a permission --</option>
                  {availablePermissions.map(perm => (
                    <option key={perm.key} value={perm.key}>{perm.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddPermissionFromDropdown}
                disabled={!selectedPermissionToAdd}
                className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40"
              >
                <FaPlus size={12} /> Add
              </button>
            </div>

            {/* List of assigned permissions with checkboxes and remove button */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {col1.map(perm => (
                <div key={perm.key} className="flex items-center justify-between group">
                  <PermCheckbox
                    label={perm.label}
                    checked={true}
                    onChange={() => togglePerm(perm.key)}
                  />
                  <button
                    onClick={() => handleRemovePermission(perm.key)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Remove"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
              {col2.map(perm => (
                <div key={perm.key} className="flex items-center justify-between group">
                  <PermCheckbox
                    label={perm.label}
                    checked={true}
                    onChange={() => togglePerm(perm.key)}
                  />
                  <button
                    onClick={() => handleRemovePermission(perm.key)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Remove"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
            </div>

            {assignedPermissions.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No permissions assigned. Use the dropdown to add.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button onClick={onClose} disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300">
              Cancel
            </button>
            <button onClick={handleUpdate} disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
              {loading ? 'Updating...' : 'Update Changes ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;