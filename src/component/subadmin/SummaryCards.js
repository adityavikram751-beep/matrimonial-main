// components/SubAdmin/SummaryCards.js

import React from 'react';

const SummaryCards = ({ title, count, users, borderColor = 'border-gray-400' }) => {
  // Get up to 5 profile images (filter out null/undefined)
  const avatars = users
    .map(user => user.profileImage)
    .filter(src => src)
    .slice(0, 5);
  
  const remaining = users.length - avatars.length;

  return (
    <div className={`border rounded-2xl p-6 shadow-md bg-white text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${borderColor}`}>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {title}
      </h2>
      <p className="text-3xl font-extrabold text-gray-800 mb-3">{count}</p>
      
      <div className="flex justify-center -space-x-2 overflow-hidden mb-2">
        {avatars.length > 0 ? (
          <>
            {avatars.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt="avatar"
                className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm"
                onError={(e) => (e.target.style.display = 'none')}
              />
            ))}
            {remaining > 0 && (
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 text-gray-600 text-xs font-medium ring-2 ring-white">
                +{remaining}
              </div>
            )}
          </>
        ) : (
          <span className="text-gray-400 text-sm">No images</span>
        )}
      </div>
    </div>
  );
};

export default SummaryCards;