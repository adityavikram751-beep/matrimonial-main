import { useEffect, useState } from 'react';
import Image from 'next/image';

import ProfileStatsCard from '@/src/component/manageusers/ProfileStatsCard';
import ApprovedProfileCard from '@/src/component/manageusers/ApprovedProfileCard';
import PendingProfileCard from '@/src/component/manageusers/PendingProfileCard';
import UserTable from '@/src/component/manageusers/ManUserTable';
import ThirdUserTable from '@/src/component/manageusers/ThirdUserTable';
import { API_URL } from '@/src/component/api/apiURL';
import StatCard from '@/src/component/manageusers/UserSummary';
import Search from '@/src/component/manageusers/Search';

const ManageUsers = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/user-stats`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  if (!stats)
    return (
      <div className="p-4 mt-[280px] flex justify-center items-center">
        <Image src="/loading2.gif" height={200} width={200} alt="Loading.." />
      </div>
    );

  return (
    <>
      {/* FIXED TOP BAR */}
      <Search />

      {/* PAGE CONTENT BELOW FIXED TOP BAR */}
      <div className="pt-[85px] p-8">

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard totalUsers={stats.totalUsers} newSignups={stats.newSignups} />
          <ProfileStatsCard
            profileCompleted={stats.profileCompleted}
            profileIncomplete={stats.profileIncomplete}
          />
          <ApprovedProfileCard data={stats.approvedProfiles} />
          <PendingProfileCard data={stats.pendingProfiles} />
        </div>

        <UserTable />
        <ThirdUserTable />

      </div>
    </>
  );
};

export default ManageUsers;
