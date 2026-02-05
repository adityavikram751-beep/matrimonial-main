// // "use client";
// // import React, { useEffect, useRef, useState } from "react";
// // import { Eye, EyeOff, Edit } from "lucide-react";

// // const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";

// // export default function Admin() {
// //   const [data, setData] = useState(null);

// //   const [openBasic, setOpenBasic] = useState(false);
// //   const [openSecurity, setOpenSecurity] = useState(false);
// //   const [openPref, setOpenPref] = useState(false);

// //   const fetchProfile = async () => {
// //     try {
// //       const res = await fetch(`${BASE_URL}/admin/profile`);
// //       const json = await res.json();
// //       setData(json.data);
// //     } catch (error) {
// //       console.log(error);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchProfile();
// //   }, []);

// //   if (!data) return <p className="p-5 text-lg">Loading...</p>;

// //   return (
// //     <div className="p-6 flex gap-6">

// //       {/* LEFT CARD */}
// //       <div className="w-[260px] bg-white p-4 rounded-xl shadow">
// //         <img
// //           src={data.profileImage}
// //           className="w-32 h-32 rounded-full mx-auto object-cover"
// //         />
// //         <button className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg">
// //           Edit profile
// //         </button>

// //         <p className="mt-4 text-center font-medium">{data.email}</p>

// //         <div className="mt-4">
// //           <p className="flex items-center gap-2 text-green-600">
// //             ● Active Now
// //           </p>

// //           <p className="flex items-center gap-2 mt-2 cursor-pointer">
// //             🔒 Change Password
// //           </p>
// //         </div>
// //       </div>

// //       {/* RIGHT */}
// //       <div className="flex-1 space-y-6">

// //         {/* BASIC INFO */}
// //         <Card title="Basic Info" onEdit={() => setOpenBasic(true)}>
// //           <Row label="Full Name" value={data.name} />
// //           <Row label="Role" value={data.role} />
// //           <Row label="E-mail address" value={data.email} />
// //           <Row label="Phone" value={data.phone} />
// //           <Row label="Assigned Region" value={data.assignedRegion} />
// //         </Card>

// //         {/* SECURITY */}
// //         <Card title="Security Setting" onEdit={() => setOpenSecurity(true)}>
// //           <Row label="Change Password" value="********" />
// //           <ToggleRow label="Two Factor Authentication" value={data.twoFactor} />
// //           <Row label="Recent login Device" value={data.recentLoginDevice} />
// //           <ToggleRow label="Alert on suspicious login" value={data.suspiciousLoginAlert} />
// //         </Card>

// //         {/* PREFERENCES */}
// //         <Card title="Preferences / Personalization" onEdit={() => setOpenPref(true)}>
// //           <Row label="Language" value={data.language} />
// //           <Row label="Default landing page" value={data.landingPage} />
// //           <Row label="Theme" value={data.theme} />
// //           <ToggleRow label="Notifications" value={data.notifications} />
// //         </Card>

// //       </div>

// //       {/* MODALS */}
// //       {openBasic && (
// //         <BasicModal
// //           data={data}
// //           close={() => setOpenBasic(false)}
// //           refresh={fetchProfile}
// //         />
// //       )}

// //       {openSecurity && (
// //         <SecurityModal
// //           data={data}
// //           close={() => setOpenSecurity(false)}
// //           refresh={fetchProfile}
//         />
// //       )}

// //       {openPref && (
// //         <PreferencesModal
// //           data={data}
// //           close={() => setOpenPref(false)}
// //           refresh={fetchProfile}
// //         />
// //       )}
// //     </div>
// //   );
// // }

// // // -------- COMPONENTS --------
// // function Card({ title, children, onEdit }) {
// //   return (
// //     <div className="bg-white rounded-xl shadow p-5 relative">
// //       <h2 className="font-semibold mb-3">{title}</h2>
// //       <button
// //         onClick={onEdit}
// //         className="absolute right-4 top-4 text-gray-500 hover:text-black"
// //       >
// //         <Edit size={20} />
// //       </button>
// //       <div className="space-y-2">{children}</div>
// //     </div>
// //   );
// // }

// // function Row({ label, value }) {
// //   return (
// //     <div className="flex justify-between text-[15px]">
// //       <span>{label}</span>
// //       <span className="font-medium">: {value}</span>
// //     </div>
// //   );
// // }

// // function ToggleRow({ label, value }) {
// //   return (
// //     <div className="flex justify-between text-[15px]">
// //       <span>{label}</span>
// //       <input type="checkbox" checked={value} readOnly className="toggle" />
// //     </div>
// //   );
// // }

// // // -------- MODAL WRAPPER (OUTSIDE CLICK CLOSE) --------
// // function ModalWrapper({ children, close }) {
// //   const ref = useRef();

// //   useEffect(() => {
// //     const handler = (e) => {
// //       if (ref.current && !ref.current.contains(e.target)) close();
// //     };
// //     document.addEventListener("mousedown", handler);
// //     return () => document.removeEventListener("mousedown", handler);
// //   }, []);

// //   return (
// //     <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
// //       <div ref={ref} className="bg-white w-[450px] rounded-xl shadow p-6">
// //         {children}
// //       </div>
// //     </div>
// //   );
// // }

// // // -------- BASIC MODAL --------
// // function BasicModal({ data, close, refresh }) {
// //   const [name, setName] = useState(data.name);
// //   const [phone, setPhone] = useState(data.phone);
// //   const [assignedRegion, setAssignedRegion] = useState(data.assignedRegion);

// //   const update = async () => {
// //     await fetch(`${BASE_URL}/admin/profile/basic`, {
// //       method: "PUT",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ name, phone, assignedRegion }),
// //     });
// //     refresh();
// //     close();
// //   };

// //   return (
// //     <ModalWrapper close={close}>
// //       <h2 className="text-xl font-semibold mb-4">Basic Info</h2>

// //       <Input label="Full Name" value={name} onChange={setName} />
// //       <Input label="Phone" value={phone} onChange={setPhone} />
// //       <Input label="Assigned Region" value={assignedRegion} onChange={setAssignedRegion} />

// //       <Buttons onSave={update} onCancel={close} />
// //     </ModalWrapper>
// //   );
// // }

// // // -------- SECURITY MODAL --------
// // function SecurityModal({ data, close, refresh }) {
// //   const [show, setShow] = useState(false);
// //   const [device, setDevice] = useState(data.recentLoginDevice);
// //   const [two, setTwo] = useState(data.twoFactor);
// //   const [alert, setAlert] = useState(data.suspiciousLoginAlert);
// //   const [pass, setPass] = useState("");

// //   const update = async () => {
// //     await fetch(`${BASE_URL}/admin/profile/security`, {
// //       method: "PUT",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         recentLoginDevice: device,
// //         twoFactor: two,
// //         suspiciousLoginAlert: alert,
// //       }),
// //     });
// //     refresh();
// //     close();
// //   };

// //   return (
// //     <ModalWrapper close={close}>
// //       <h2 className="text-xl font-semibold mb-4">Security Settings</h2>

// //       <label className="text-sm">Change Password :</label>
// //       <div className="border rounded-md flex items-center px-3 mb-3">
// //         <input
// //           type={show ? "text" : "password"}
// //           className="flex-1 py-2"
// //           value={pass}
// //           onChange={(e) => setPass(e.target.value)}
// //         />
// //         <button onClick={() => setShow(!show)}>
// //           {show ? <EyeOff /> : <Eye />}
// //         </button>
// //       </div>

// //       <ToggleInput label="Two Factor Authentication" value={two} setValue={setTwo} />
// //       <Input label="Recent Login Device" value={device} onChange={setDevice} />
// //       <ToggleInput label="Alert on suspicious login" value={alert} setValue={setAlert} />

// //       <Buttons onSave={update} onCancel={close} />
// //     </ModalWrapper>
// //   );
// // }

// // // -------- PREFERENCES MODAL --------
// // function PreferencesModal({ data, close, refresh }) {
// //   const [language, setLanguage] = useState(data.language);
// //   const [theme, setTheme] = useState(data.theme);
// //   const [notifications, setNotifications] = useState(data.notifications);
// //   const [landingPage, setLandingPage] = useState(data.landingPage);

// //   const update = async () => {
// //     await fetch(`${BASE_URL}/admin/profile/preferences`, {
// //       method: "PUT",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         language,
// //         theme,
// //         notifications,
// //         landingPage,
// //       }),
// //     });

// //     refresh();
// //     close();
// //   };

// //   return (
// //     <ModalWrapper close={close}>
// //       <h2 className="text-xl font-semibold mb-4">Preferences</h2>

// //       <Input label="Language" value={language} onChange={setLanguage} />
// //       <Input label="Theme" value={theme} onChange={setTheme} />
// //       <ToggleInput label="Notifications" value={notifications} setValue={setNotifications} />
// //       <Input label="Landing Page" value={landingPage} onChange={setLandingPage} />

// //       <Buttons onSave={update} onCancel={close} />
// //     </ModalWrapper>
// //   );
// // }


// // // -------- SMALL UI --------
// // function Input({ label, value, onChange }) {
// //   return (
// //     <div className="mb-3">
// //       <label className="text-sm">{label}</label>
// //       <input
// //         className="w-full border px-3 py-2 rounded-md"
// //         value={value}
// //         onChange={(e) => onChange(e.target.value)}
// //       />
// //     </div>
// //   );
// // }

// // function ToggleInput({ label, value, setValue }) {
// //   return (
// //     <div className="flex justify-between items-center mb-3">
// //       <span>{label} :</span>
// //       <input
// //         type="checkbox"
// //         checked={value}
// //         onChange={() => setValue(!value)}
// //         className="toggle"
// //       />
// //     </div>
// //   );
// // }

// // function Buttons({ onSave, onCancel }) {
// //   return (
// //     <div className="flex justify-end gap-3 mt-4">
// //       <button
// //         onClick={onCancel}
// //         className="bg-red-600 text-white px-5 py-2 rounded-lg"
// //       >
// //         Discard
// //       </button>
// //       <button
// //         onClick={onSave}
// //         className="bg-green-600 text-white px-5 py-2 rounded-lg"
// //       >
// //         Save
// //       </button>
// //     </div>
// //   );
// // }
