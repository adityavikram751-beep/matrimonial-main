import Search from '@/src/component/subadmin/Search';
import SubAdminPage from '@/src/component/subadmin/SubAdminPage';
import React from 'react';

const SubAdmins = () => {
  return (
    <>
      {/* FIXED TOP BAR */}
      <Search />

      {/* SCROLLABLE CONTENT */}
      <div className="pt-[100px] h-screen overflow-y-auto px-4">
        <SubAdminPage />
      </div>
    </>
  );
};

export default SubAdmins;
