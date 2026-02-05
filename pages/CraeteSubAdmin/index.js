// pages/createsubadmin.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { permissionsList } from '@/public/data/data';

const CreateSubAdmin = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    permissions: permissionsList.map((perm) => ({ name: perm, enabled: false })),
  });

  const handlePermissionChange = (index) => {
    const updatedPermissions = [...formData.permissions];
    updatedPermissions[index].enabled = !updatedPermissions[index].enabled;
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', formData);
    router.push('/subadmins');  
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">Create Sub Admin</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="w-full border p-2 rounded"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <select
          className="w-full border p-2 rounded"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          required
        >
          <option value="" disabled>Select Role</option>
          <option>Report Moderator</option>
          <option>Verification Officer</option>
        </select>

        <div>
          <p className="font-medium mb-1">Permissions</p>
          {formData.permissions.map((perm, index) => (
            <label key={perm.name} className="block">
              <input
                type="checkbox"
                checked={perm.enabled}
                onChange={() => handlePermissionChange(index)}
                className="mr-2"
              />
              {perm.name}
            </label>
          ))}
        </div>

        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateSubAdmin;
