'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HiMenu, HiX } from 'react-icons/hi';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/router';

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Manage Users', href: '/manageusers' },
  { label: 'Reported Content', href: '/reportedcontent' },
  { label: 'Verification Request', href: '/verificationrequest' },
  { label: 'Manage Sub Admin', href: '/managesubadmin' },
  { label: 'Profile Details', href: '/profileDetails' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  // 🔥 Sidebar Profile State
  const [profile, setProfile] = useState({
    name: 'Super Admin',
    profileImage: '/profile.png',
    role: 'Super Admin',
  });

  // 🔥 Load sidebar profile
  const loadSidebarProfile = () => {
    try {
      const raw = localStorage.getItem('admin_profile');
      if (raw) {
        const data = JSON.parse(raw);
        setProfile({
          name: data?.name || 'Super Admin',
          profileImage: data?.profileImage || '/profile.png',
          role: data?.role || 'Super Admin',
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    // initial load
    loadSidebarProfile();

    // listen to profile page updates
    const listener = () => loadSidebarProfile();
    window.addEventListener('adminProfileUpdated', listener);

    // listen if updated in another tab
    const storageListener = (e) => {
      if (e.key === 'admin_profile') loadSidebarProfile();
    };
    window.addEventListener('storage', storageListener);

    return () => {
      window.removeEventListener('adminProfileUpdated', listener);
      window.removeEventListener('storage', storageListener);
    };
  }, []);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-white rounded shadow border border-gray-300"
        >
          {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
        </button>
      </div>

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-[250px] bg-gray-100 border-r border-gray-300 p-4 z-40 transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:block`}
      >
        <h1 className="text-3xl font-bold mb-6 hidden md:block">LOGO</h1>

        {/* ---------- PROFILE BOX (AUTO UPDATE) ----------- */}
        <Link href="/adminprofile" className="block">
          <div className="bg-white rounded-md shadow p-2 mb-6 gap-2 flex items-center space-x-3 border border-gray-300 hover:bg-gray-100 cursor-pointer">

            <div className="flex justify-center items-center">
              <div className="w-[50px] h-[50px] flex justify-center items-center rounded-full bg-red-100 relative overflow-hidden">
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <p className="font-semibold text-sm">{profile.name}</p>
              <p className="text-xs text-gray-500">{profile.role}</p>
            </div>

          </div>
        </Link>

        {/* ----------- NAV ITEMS ------------- */}
        <nav className="flex flex-col space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`cursor-pointer px-4 py-2 font-semibold text-sm flex items-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[#a52a3d] text-white border border-[#a52a3d]'
                      : 'bg-white text-gray-900 border border-gray-400 hover:bg-[#a52a3d] hover:text-white hover:border-[#a52a3d]'
                  } rounded-[10px]`}
                  onClick={() => setIsOpen(false)}
                >
                  <span
                    className={`mr-2 text-lg font-bold ${
                      isActive ? 'text-white' : 'text-transparent'
                    }`}
                  >
                    |
                  </span>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ---------- LOGOUT ---------- */}
        <button
          onClick={() => router.push('/logout')}
          className="absolute bottom-6 left-4 flex items-center space-x-2 text-gray-800 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
