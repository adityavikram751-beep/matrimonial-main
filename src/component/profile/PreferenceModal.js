// // src/components/profile/PreferenceModal.js
// import React from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { preferenceSchema } from "@/zod/profileSchemas";

// const PreferenceModal = ({ onClose, onSubmit, defaultValues }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors }
//   } = useForm({
//     resolver: zodResolver(preferenceSchema),
//     defaultValues
//   });

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl p-6 w-full max-w-md">
//         <h2 className="text-lg font-bold mb-4">Edit Preferences</h2>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           <select {...register("language")} className="w-full border px-3 py-2 rounded">
//             <option value="">Select Language</option>
//             <option value="English">English</option>
//             <option value="Hindi">Hindi</option>
//           </select>

//           <select {...register("landingPage")} className="w-full border px-3 py-2 rounded">
//             <option value="Dashboard">Dashboard</option>
//             <option value="Settings">Settings</option>
//           </select>

//           <select {...register("theme")} className="w-full border px-3 py-2 rounded">
//             <option value="light">🌞 Light</option>
//             <option value="dark">🌙 Dark</option>
//           </select>

//           <label className="flex items-center gap-2">
//             <input type="checkbox" {...register("notifications")} />
//             Enable Notifications
//           </label>

//           <div className="flex justify-end gap-2">
//             <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
//             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }; 

// export default PreferenceModal;
