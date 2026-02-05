import React from 'react';

const ViewModal = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[600px]">
        <div className="flex items-start gap-6">
          <img src={data.avatar} className="w-20 h-20 rounded-full" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">{data.name}</h2>
            <p className="text-sm text-gray-500">{data.role}</p>
            <p className="text-green-600 mt-1">{data.status === 'Active' ? '• Currently Active' : '• Inactive'}</p>

            {/* Basic Info */}
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h3 className="font-semibold mb-2">Basic Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Email:</strong> {data.email}</div>
                <div><strong>Phone:</strong> {data.phone}</div>
                <div><strong>Date:</strong> {data.date}</div>
                <div><strong>Sub Admin ID:</strong> {data.userId}</div>
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-4 bg-orange-50 p-3 rounded">
              <h3 className="font-semibold mb-2">Assigned Permissions</h3>
              <div className="grid grid-cols-2 gap-2">
                {data.permissions.map((perm, idx) => (
                  <label key={idx} className="flex items-center space-x-2">
                    <input type="checkbox" checked={perm.enabled} readOnly />
                    <span>{perm.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-2">
              <button className="bg-green-500 text-white px-4 py-1 rounded">Save</button>
              <button onClick={onClose} className="bg-gray-500 text-white px-4 py-1 rounded">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
