'use client';

import React from "react";
import Image from "next/image";
import { Pencil, Lock } from "lucide-react";

const LeftProfileCard = ({ profile, onEditProfile, onChangePassword }) => {
  return (
    <div className="w-full max-w-sm mx-auto px-4 py-5 flex flex-col items-center">
      {/* Profile Image with Edit Button */}
      <div className="relative">
        <Image
          src={profile.image || "/profile.png"}
          alt="Profile"
          width={100}
          height={100}
          className="rounded-full object-cover border"
        />
        <button
          onClick={onEditProfile}
          className="absolute bottom-0 right-0 bg-green-600 text-white px-2 py-1 text-xs rounded-full flex items-center gap-1 hover:bg-green-700"
          aria-label="Edit Profile"
        >
          <Pencil size={12} />
        </button>
      </div>

      {/* Email */}
      <p className="mt-4 font-medium text-center text-sm sm:text-base">
        {profile.email}
      </p>

      {/* Status Indicator */}
      <div className="flex items-center mt-2 space-x-2 text-sm">
        <span
          className={`h-3 w-3 rounded-full ${
            profile.isOnline ? "bg-green-500" : "bg-red-500"
          }`}
        ></span>
        <span>{profile.isOnline ? "Active Now" : "Inactive"}</span>
      </div>

      {/* Change Password */}
      <button
        onClick={onChangePassword}
        className="mt-3 flex items-center space-x-1 text-blue-600 hover:underline text-sm"
        aria-label="Change Password"
      >
        <Lock size={14} />
        <span>Change Password</span>
      </button>
    </div>
  );
};

export default LeftProfileCard;




// import React from "react";
// import Image from "next/image";
// import { Pencil, Lock } from "lucide-react";

// const LeftProfileCard = ({ profile, onEditProfile, onChangePassword }) => {
//   return (
//     <div className=" px-4 py-5 flex flex-col items-center w-full max-w-sm">
//       <div className="relative">
//         <Image
//           src={profile.image || "/profile.png"}
//           alt="Profile"
//           width={100}
//           height={100}
//           className="rounded-full object-cover border"
//         />
//         <button
//           onClick={onEditProfile}
//           className="absolute bottom-0 right-0 bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700"
//         >
//           Edit profile
//         </button>
//       </div>

//       <p className="mt-4 font-medium">{profile.email}</p>

//       <div className="flex items-center mt-2 space-x-2 text-sm">
//         <span
//           className={`h-3 w-3 rounded-full ${
//             profile.isOnline ? "bg-green-500" : "bg-red-500"
//           }`}
//         ></span>
//         <span>{profile.isOnline ? "Active Now" : "Inactive"}</span>
//       </div>

//       <button
//         onClick={onChangePassword}
//         className="mt-3 flex items-center space-x-1 text-blue-600 hover:underline text-sm"
//       >
//         <Lock size={14} />
//         <span>Change Password</span>
//       </button>
//     </div>
//   );
// };

// export default LeftProfileCard;
