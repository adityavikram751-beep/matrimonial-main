// components/SummaryCard.js
import React from 'react';
const SummaryCard = ({ title, count, users = [], borderColor }) => (
  <div className="bg-white border-2 flex justify-center items-center border-gray-400 shadow rounded-lg shadow-md p-3 w-60 h-40 text-center">
    <div>
    <div className="text-2xl mb-3 font-medium text-gray-700">{title}</div>
    <div className="flex justify-between -space-x-3 my-2">
      {users.slice(0, 6).map((user, idx) => (
        <img
          key={idx}
          src={user.avatar}
          className={`w-10 h-10 rounded-full border-2 ${borderColor} object-cover`}
          alt={user.name}
          title={user.name}
        />
      ))}
      {users.length > 6 && (
        <span className="w-10 h-10 rounded-full bg-gray-200 text-xs flex items-center justify-center font-medium text-gray-700 border">
          +{users.length - 6}
        </span>
      )}
    </div>
    <div className="text-3xl mt-5 font-semibold">{count}</div>
    </div>
  </div>
);


export default SummaryCard;
