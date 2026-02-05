import React, { useState } from 'react';
import { Edit2, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import BasicInfoModal from './modals/BasicInfoModal';
import PreferencesModal from './modals/PreferencesModal';
import ChangePasswordModal from './modals/ChangePasswordModal';

export default function AdminProfileRight({ profileData, onUpdate }) {
  const [editBasicOpen, setEditBasicOpen] = useState(false);
  const [editPrefOpen, setEditPrefOpen] = useState(false);
  const [editPassOpen, setEditPassOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">

      {/* Basic Info Card */}
      <div className="border rounded-xl p-4 bg-amber-50 shadow">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold">Basic Info</h2>
          <button onClick={() => setEditBasicOpen(true)}>
            <Edit2 size={18} />
          </button>
        </div>
        <div className="space-y-1 text-sm">
          <p><b>Full Name:</b> {profileData.name}</p>
          <p><b>Role:</b> {profileData.role}</p>
          <p><b>E-mail address:</b> {profileData.email}</p>
          <p><b>Phone:</b> {profileData.phone}</p>
          <p><b>Assigned Region:</b> {profileData.region}</p>
        </div>
      </div>

      {/* Security Settings */}
      <div className="border rounded-xl p-4 bg-white shadow">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold">Security Setting</h2>
          <button onClick={() => setEditPassOpen(true)}>
            <Edit2 size={18} />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span><b>Change Password</b></span>
            <span>••••••••</span>
          </p>
          <p className="flex justify-between">
            <span><b>Two Factor Authentication</b></span>
            <Switch checked={profileData.twoFactor} />
          </p>
          <p><b>Recent login Device</b>: {profileData.recentDevice}</p>
          <p className="flex justify-between">
            <span><b>Alert on suspicious login</b></span>
            <Switch checked={profileData.alertSuspicious} />
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="border rounded-xl p-4 bg-white shadow col-span-1">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold">Preferences / Personalization</h2>
          <button onClick={() => setEditPrefOpen(true)}>
            <Edit2 size={18} />
          </button>
        </div>
        <div className="space-y-1 text-sm">
          <p><b>Language:</b> {profileData.language}</p>
          <p><b>Default landing page:</b> {profileData.landingPage}</p>
          <p><b>Theme:</b> {profileData.theme === 'light' ? '🌞 Light' : '🌙 Dark'}</p>
          <p className="flex justify-between">
            <span><b>Notifications</b></span>
            <Switch checked={profileData.notifications} />
          </p>
        </div>
      </div>

      {/* Modals */}
      <BasicInfoModal open={editBasicOpen} onClose={() => setEditBasicOpen(false)} data={profileData} onSave={onUpdate} />
      <ChangePasswordModal open={editPassOpen} onClose={() => setEditPassOpen(false)} />
      <PreferencesModal open={editPrefOpen} onClose={() => setEditPrefOpen(false)} data={profileData} onSave={onUpdate} />

    </div>
  );
}
