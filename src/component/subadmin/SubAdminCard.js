// components/SubAdmin/SubAdminCard.js

import React from 'react';

const dummyCounts = {
  total: 50,
  active: 25,
  suspended: 10,
};

const avatarImages = [
  '/avatar1.jpg',
  '/avatar2.jpg',
  '/avatar3.jpg',
  '/avatar4.jpg',
  '/avatar5.jpg',
  '/avatar6.jpg',
];

const SubAdminCard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      <div className="border rounded-xl p-4 shadow bg-white text-center">
        <h2 className="font-semibold mb-2">Total Sub Admin</h2>
        <div className="flex justify-center -space-x-2 overflow-hidden mb-2">
          {avatarImages.slice(0, 5).map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt="avatar"
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
            />
          ))}
        </div>
        <p className="text-2xl font-bold">{dummyCounts.total}</p>
      </div>

      {/* Active Sub Admin */}
      <div className="border rounded-xl p-4 shadow bg-white text-center">
        <h2 className="font-semibold mb-2">Active Sub Admin</h2>
        <div className="flex justify-center -space-x-2 overflow-hidden mb-3">
          {avatarImages.slice(1, 6).map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt="avatar"
              className="inline-block h-10 w-10 rounded-full ring-2 ring-green-500"
            />
          ))}
        </div>
        <p className="text-2xl font-bold">{dummyCounts.active}</p>
      </div>

      {/* Suspended Sub Admin */}
      <div className="border rounded-xl p-4 shadow bg-white text-center">
        <h2 className="font-semibold mb-2">Suspended Sub Admin</h2>
        <div className="flex justify-center -space-x-2 overflow-hidden mb-2">
          {avatarImages.slice(2, 7).map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt="avatar"
              className="inline-block h-10 w-10 rounded-full ring-2 ring-red-500"
            />
          ))}
        </div>
        <p className="text-2xl font-bold">{dummyCounts.suspended}</p>
      </div>
    </div>
  );
};

export default SubAdminCard;
