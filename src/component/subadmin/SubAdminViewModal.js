import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaChevronDown, FaPlus } from 'react-icons/fa';

const API_URL = 'https://merimonial-backend.onrender.com';

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

const PermCheckbox = ({ label, checked, onChange, onDelete, isCustom }) => (
  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none group">
    <input type="checkbox" checked={checked} onChange={onChange}
      className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
    <span className="flex-1">{label}</span>
    {isCustom && (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onDelete(); }}
        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition ml-1"
        title="Remove"
      >
        <FaTimes size={10} />
      </button>
    )}
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

  const [allPermissions, setAllPermissions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [customInput, setCustomInput] = useState('');

  const fileInputRef = useRef(null);
  const customInputRef = useRef(null);

  // Initialize form with data from props
  useEffect(() => {
    if (data) {
      console.log('Data received in EditModal:', data); // Debug log
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
      
      // Initialize permissions
      if (data.permissions && Array.isArray(data.permissions)) {
        const currentPermissions = data.permissions.map(perm => {
          if (typeof perm === 'string') return { key: perm, label: perm.replace(/_/g, ' '), isCustom: true };
          return perm;
        });
        
        setAllPermissions(currentPermissions);
        setPermissions(data.permissions.map(perm => typeof perm === 'string' ? perm : perm.key));
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

  const togglePerm = (key) =>
    setPermissions((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const handleAddCustomPermission = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    const key = trimmed.toUpperCase().replace(/\s+/g, '_');
    const label = trimmed
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    if (allPermissions.find((p) => p.key === key)) {
      setCustomInput('');
      return;
    }

    const newPerm = { key, label, isCustom: true };
    setAllPermissions((prev) => [...prev, newPerm]);
    setPermissions((prev) => [...prev, key]);
    setCustomInput('');
    customInputRef.current?.focus();
  };

  const handleDeleteCustomPermission = (key) => {
    setAllPermissions((prev) => prev.filter((p) => p.key !== key));
    setPermissions((prev) => prev.filter((k) => k !== key));
  };

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
      // First, update the profile using FormData
      const fd = new FormData();
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('role', form.role);
      fd.append('gender', form.gender);
      fd.append('status', form.status);
      
      if (form.profileImageFile) {
        fd.append('profileImage', form.profileImageFile);
      }

      const token = localStorage.getItem('token');
      const updateUrl = `${API_URL}/api/sub-admin/update/sub-admin-profile/${data._id}`;
      
      console.log('Updating at URL:', updateUrl); // Debug log
      console.log('Form data being sent:', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        gender: form.gender,
        status: form.status,
        hasNewImage: !!form.profileImageFile
      });
      
      const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });
      
      const responseData = await res.json();
      console.log('Update response:', responseData); // Debug log
      
      if (!res.ok) {
        setError(`Update failed: ${responseData.message || 'Unknown error'}`);
        setDebugInfo(`Status: ${res.status}, Response: ${JSON.stringify(responseData)}`);
        setLoading(false);
        return;
      }
      
      if (!responseData.success) {
        setError(responseData.message || 'Update failed');
        setDebugInfo(`Success flag false: ${JSON.stringify(responseData)}`);
        setLoading(false);
        return;
      }

      setSuccess('Profile updated successfully!');
      
      // Now update permissions
      if (permissions.length > 0 || data.permissions) {
        const permRes = await fetch(`${API_URL}/api/sub-admin/add/tab-permission`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            subAdminId: data._id, 
            permissionTabs: permissions 
          }),
        });
        
        const permData = await permRes.json();
        console.log('Permission update response:', permData); // Debug log
        
        if (!permRes.ok || !permData.success) {
          console.error('Permission update failed:', permData.message);
          setError('Profile updated but permission update failed');
        } else {
          setSuccess('Profile and permissions updated successfully!');
        }
      }

      // Call refresh function to update parent component data
      if (onRefresh) {
        await onRefresh(); // Wait for refresh to complete
      }

      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (err) {
      console.error('Update error:', err); // Debug log
      setError(`Network error: ${err.message}`);
      setDebugInfo(`Error details: ${JSON.stringify(err)}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const col1 = allPermissions.filter((_, i) => i % 2 === 0);
  const col2 = allPermissions.filter((_, i) => i % 2 !== 0);

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
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Sub Admin</h2>
              <p className="text-sm text-gray-500">Update profile information</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
            <FaTimes />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-pulse">
              <p className="text-green-700 text-sm flex items-center gap-2">
                <span>✅</span> {success}
                <span className="text-xs ml-2">Closing in a moment...</span>
              </p>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-semibold">Error: {error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">Debug Info</summary>
                  <pre className="text-xs text-red-500 mt-1 whitespace-pre-wrap">{debugInfo}</pre>
                </details>
              )}
            </div>
          )}

          {/* Basic Info Section */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">📝</span> Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="firstName" 
                  placeholder="e.g., Pritam" 
                  value={form.firstName} 
                  onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="lastName" 
                  placeholder="e.g., Sharma" 
                  value={form.lastName} 
                  onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="pritam@gmail.com" 
                  value={form.email} 
                  onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="phone" 
                  placeholder="+91 XXXXXXXXXX" 
                  value={form.phone} 
                  onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                <select 
                  name="gender" 
                  value={form.gender} 
                  onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleInput}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <RoleInput 
                  value={form.role} 
                  onChange={(val) => setForm((prev) => ({ ...prev, role: val }))} 
                />
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="rounded-xl px-4 py-4" style={{ background: '#fffbf0' }}>
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              Assigned Permissions
              <span className="ml-2 text-xs font-normal text-gray-400">({permissions.length} selected)</span>
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
              {col1.map((perm) => (
                <PermCheckbox 
                  key={perm.key} 
                  label={perm.label} 
                  isCustom={perm.isCustom}
                  checked={permissions.includes(perm.key)}
                  onChange={() => togglePerm(perm.key)}
                  onDelete={() => handleDeleteCustomPermission(perm.key)} 
                />
              ))}
              {col2.map((perm) => (
                <PermCheckbox 
                  key={perm.key} 
                  label={perm.label} 
                  isCustom={perm.isCustom}
                  checked={permissions.includes(perm.key)}
                  onChange={() => togglePerm(perm.key)}
                  onDelete={() => handleDeleteCustomPermission(perm.key)} 
                />
              ))}
            </div>

            {/* Custom permission input */}
            <div className="border-t border-yellow-200 pt-3 mt-1">
              <p className="text-xs font-semibold text-gray-500 mb-2">➕ Add Custom Permission</p>
              <div className="flex gap-2">
                <input
                  ref={customInputRef}
                  type="text"
                  placeholder="e.g., Manage Payments"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPermission()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPermission}
                  disabled={!customInput.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40"
                >
                  <FaPlus size={10} /> Add
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or click Add. Hover on custom items to remove them.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Updating...' : 'Update Changes ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;