// components/profile/ProfileCard.js
import { Pencil } from 'lucide-react';

const ProfileCard = ({ title, data, onEdit }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm relative">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <ul className="text-sm space-y-1">
        {Object.entries(data).map(([key, val]) => (
          <li key={key}>
            <strong>{key}:</strong> {val}
          </li>
        ))}
      </ul>
      <button
        onClick={onEdit}
        className="absolute top-4 right-4 text-gray-600 hover:text-indigo-600"
      >
        <Pencil size={16} />
      </button>
    </div>
  );
};

export default ProfileCard;
