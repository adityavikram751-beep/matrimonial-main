import React from 'react';

const ConfirmDialog = ({ user, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded shadow w-[300px] text-center">
        <p className="mb-4 font-medium">
          Are you sure you wanna remove <br />
          {user.name} ({user.userId}) from Sub Admin?
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onCancel} className="bg-green-600 text-white px-4 py-1 rounded">No, Quit</button>
          <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-1 rounded">Yes, Remove</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
