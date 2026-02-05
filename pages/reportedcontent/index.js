import React from 'react';
import Search from '@/src/component/reportedcontent/Search';
import ReportDashboard from '@/src/component/reportedcontent/ReportDashboard';

const ReportDashboardPage = () => {
  return (
    <div className="h-screen flex flex-col">

      {/* Sticky Top Bar */}
      <div className="shadow-md sticky top-0 z-30 bg-[#f5f5f5]">
        <Search />
      </div>

      {/* Scrollable bottom area */}
      <div className="flex-1 overflow-y-auto">
        <ReportDashboard />
      </div>

    </div>
  );
};

export default ReportDashboardPage;
