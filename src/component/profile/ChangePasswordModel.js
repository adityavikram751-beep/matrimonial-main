import React from "react";
import { useForm } from "react-hook-form";

const ChangePasswordModal = ({ onClose, onChange }) => {
  const { register, handleSubmit, watch } = useForm();

  const onSubmit = (data) => {
    onChange(data.password);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md shadow">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm">New Password</label>
            <input
              type="password"
              {...register("password", { required: true, minLength: 6 })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm">Confirm Password</label>
            <input
              type="password"
              {...register("confirmPassword", {
                validate: (val) =>
                  val === watch("password") || "Passwords do not match",
              })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
