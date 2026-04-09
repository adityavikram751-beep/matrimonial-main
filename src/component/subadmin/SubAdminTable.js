import React, { useState, useEffect, useRef } from 'react';
import { FaSort, FaTimes, FaChevronDown, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa';

const API_URL = 'https://merimonial-backend.onrender.com';

const DEFAULT_PERMISSIONS = [
  { key: 'DASHBOARD',        label: 'Dashboard' },
  { key: 'ANALYTICS',       label: 'Analytics' },
  { key: 'MANAGE_USERS',     label: 'Manage Users' },
  { key: 'REPORTED_CONTENT',     label: 'Reported Content' },
  { key: 'VARIFICATION_REQUEST', label: 'Verification Requests' },
  { key: 'PROFILE_DETAILS',     label: 'Profile Details' },
];

const ROLE_SUGGESTIONS = ['reporter', 'moderator', 'verification_officer', 'analyst', 'support'];

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

// ─── Create Sub Admin Modal (with password visibility toggle) ────────────────
const CreateSubAdminModal = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState(null);

  // 👇 State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: '', gender: 'male', status: 'active',
    password: '', profileImage: null, profileImageFile: null,
  });

  const [allPermissions, setAllPermissions] = useState(DEFAULT_PERMISSIONS);
  const [permissions, setPermissions] = useState([]);
  const [customInput, setCustomInput] = useState('');

  const fileInputRef = useRef(null);
  const customInputRef = useRef(null);

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

  const handleSignUp = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.role) {
      setError('Please fill all required fields');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError('Password is required and must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('role', form.role);
      fd.append('gender', form.gender);
      fd.append('status', form.status);
      fd.append('password', form.password);
      if (form.profileImageFile) fd.append('profileImage', form.profileImageFile);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/sub-admin/signUp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Signup failed');
        return;
      }
      setCreatedId(data.data._id);
      setStep(2);
    } catch (err) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermissions = async () => {
    if (!createdId) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/sub-admin/add/tab-permission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subAdminId: createdId, permissionTabs: permissions }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Permission update failed');
        return;
      }
      onCreated();
      onClose();
    } catch (err) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const col1 = allPermissions.filter((_, i) => i % 2 === 0);
  const col2 = allPermissions.filter((_, i) => i % 2 !== 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group w-12 h-12">
              <img src={form.profileImage || 'https://via.placeholder.com/48'}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200" alt="avatar" />
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs">📷</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {form.firstName ? `${form.firstName} ${form.lastName}` : 'New Sub Admin'}
              </h2>
              {form.role && <p className="text-sm text-gray-500 capitalize">{form.role}</p>}
              <p className="text-xs font-medium mt-0.5 text-green-600">
                <span className="inline-block w-2 h-2 rounded-full mr-1 bg-green-500 align-middle" />
                {form.status}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg"><FaTimes /></button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 px-6 pt-4 flex-shrink-0">
          {['Basic Info', 'Permissions'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step === i + 1 ? '#4f46e5' : step > i + 1 ? '#16a34a' : '#e5e7eb',
                  color: step >= i + 1 ? '#fff' : '#6b7280',
                }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
              {i === 0 && <span className="text-gray-300 mx-1">›</span>}
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <hr className="border-gray-100 mb-4" />

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input type="text" name="firstName" placeholder="e.g., Pritam" value={form.firstName} onChange={handleInput}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" name="lastName" placeholder="e.g., Sharma" value={form.lastName} onChange={handleInput}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" placeholder="pritam@gmail.com" value={form.email} onChange={handleInput}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="text" name="phone" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={handleInput}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                </div>
                {/* Password field with visibility toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={handleInput}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                  <select name="gender" value={form.gender} onChange={handleInput}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleInput}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role <span className="text-red-500">*</span></label>
                  <RoleInput value={form.role} onChange={(val) => setForm((prev) => ({ ...prev, role: val }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Profile Photo (optional)</label>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-4 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition">
                    <img src={form.profileImage || 'https://via.placeholder.com/48'}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 flex-shrink-0" alt="preview" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-600">
                        {form.profileImage ? '✅ Photo selected — click to change' : '📷 Click to upload photo'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP supported</p>
                    </div>
                  </div>
                </div>
              </div>
              {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">Cancel</button>
                <button onClick={handleSignUp} disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
                  {loading ? 'Creating...' : 'Next: Permissions →'}
                </button>
              </div>
            </>
          )}

          {/* STEP 2 (unchanged) */}
          {step === 2 && (
            <>
              <div className="rounded-xl px-4 py-4" style={{ background: '#fffbf0' }}>
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Assigned Permissions
                  <span className="ml-2 text-xs font-normal text-gray-400">({permissions.length} selected)</span>
                </h3>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                  {col1.map((perm) => (
                    <PermCheckbox key={perm.key} label={perm.label} isCustom={perm.isCustom}
                      checked={permissions.includes(perm.key)}
                      onChange={() => togglePerm(perm.key)}
                      onDelete={() => handleDeleteCustomPermission(perm.key)} />
                  ))}
                  {col2.map((perm) => (
                    <PermCheckbox key={perm.key} label={perm.label} isCustom={perm.isCustom}
                      checked={permissions.includes(perm.key)}
                      onChange={() => togglePerm(perm.key)}
                      onDelete={() => handleDeleteCustomPermission(perm.key)} />
                  ))}
                </div>

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

              {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
              <div className="flex justify-between gap-2 pt-4">
                <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">← Back</button>
                <div className="flex gap-2">
                  <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition">Cancel</button>
                  <button onClick={handleAddPermissions} disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60">
                    {loading ? 'Saving...' : 'Create Sub Admin ✓'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main SubAdminTable ───────────────────────────────────────────────────────
const SubAdminTable = ({ onView }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [admins, setAdmins] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const limit = 10;

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/api/sub-admin/all/sub-admin/list?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setAdmins(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, [search, statusFilter, currentPage]);

  const handleRemove = async (id) => {
    if (!confirm('Remove this sub admin?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/sub-admin/delete/sub-admin?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdmins((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      alert('Network error. Try again.');
    }
  };

  return (
    <div className="bg-white border border-gray-400 rounded shadow p-4">

      <div className="flex border p-1 rounded border-gray-400 shadow flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <input type="text" placeholder="Search by Name / ID" value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 focus:outline-0 px-3 py-2 rounded w-full sm:w-[20%]" />
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 bg-gray-200 cursor-pointer p-1 rounded w-auto">
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-indigo-700 transition">
            Create Sub Admin
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateSubAdminModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { fetchAdmins(); setShowCreateModal(false); }}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full border border-gray-400 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-2">Sub Admin <FaSort className="inline ml-1" /></th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role <FaSort className="inline ml-1" /></th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">Loading...</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">No sub admins found.</td></tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin._id} className="border border-gray-400 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <img src={admin.profileImage || 'https://via.placeholder.com/32'}
                        className="w-8 h-8 rounded-full object-cover" alt={admin.firstName} />
                      <div>
                        <p className="font-semibold">{admin.firstName} {admin.lastName}</p>
                        <p className="text-xs text-gray-500">{admin.subAdminId} / {admin.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{admin.email}</td>
                  <td className="px-3 py-2 capitalize">{admin.role}</td>
                  <td className="px-3 py-2">{admin.phone}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${admin.status === 'active' ? 'bg-green-700' : 'bg-red-500'}`} />
                    <span className="capitalize">{admin.status}</span>
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button onClick={() => onView && onView(admin)} className="text-black hover:underline">View</button>
                    <button onClick={() => handleRemove(admin._id)} className="text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600 transition">Remove</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="text-center mt-4 flex flex-wrap justify-center gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-40">◄</button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button key={idx}
              className={`px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-black text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentPage(idx + 1)}>
              {idx + 1}
            </button>
          ))}
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-40">►</button>
        </div>
      )}
    </div>
  );
};

export default SubAdminTable;