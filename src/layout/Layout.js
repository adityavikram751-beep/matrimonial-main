// components/common/Layout.js (or .tsx)
import React from 'react';
import Sidebar from '../component/common/sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 overflow-y-auto  bg-gray-100">
        {children}
      </main>
    </div>
  );
};

export default Layout;
