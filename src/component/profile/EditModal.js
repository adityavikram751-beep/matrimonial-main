// components/profile/EditModal.js
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  zone: z.string().min(2),
});

const EditModal = ({ isOpen, onClose, onSave, initialData }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    onSave(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[90%] max-w-md shadow-lg"
      >
        <h2 className="text-lg font-semibold mb-4">Edit Basic Info</h2>

        <input
          {...register('name')}
          placeholder="Full Name"
          className="mb-2 w-full border rounded px-3 py-2"
        />
        <input
          {...register('role')}
          placeholder="Role"
          className="mb-2 w-full border rounded px-3 py-2"
        />
        <input
          {...register('email')}
          placeholder="Email"
          className="mb-2 w-full border rounded px-3 py-2"
        />
        <input
          {...register('phone')}
          placeholder="Phone"
          className="mb-2 w-full border rounded px-3 py-2"
        />
        <input
          {...register('zone')}
          placeholder="Zone / Location"
          className="mb-4 w-full border rounded px-3 py-2"
        />

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditModal;
