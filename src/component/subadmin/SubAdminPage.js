import React, { useState } from 'react';
import SubAdminTable from './SubAdminTable';
import SubAdminRemoveModal from './SubAdminRemoveModal';
import SubAdminViewModal from './SubAdminViewModal';

import { subAdminsData } from '../../../public/data/data';
import SummaryCards from './SummaryCards';

const SubAdminPage = () => {
  const [viewData, setViewData] = useState(null);
  const [removeId, setRemoveId] = useState(null);
  const [admins, setAdmins] = useState(subAdminsData);
  const active = admins.filter((a) => a.status === 'Active');
  const suspended = admins.filter((a) => a.status === 'Suspended');

 const handleRemove = async () => {
  try {
    await fetch(`${API_URL}/subadmins/${removeId}`, {
      method: "DELETE",
    });

    setAdmins(admins.filter(a => a._id !== removeId));
    setRemoveId(null);
  } catch (error) {
    console.error("Failed to delete:", error);
  }
};

  return (
    <>

      <div className="flex gap-5  justify-around p-4 flex-wrap">
        <SummaryCards
          title="Total Sub Admin"
          count={admins.length}
          users={admins}
          borderColor="border-gray-400"
        />
        <SummaryCards
          title="Active Sub Admin"
          count={active.length}
          users={active}
          borderColor="border-green-500"
        />
        <SummaryCards
          title="Suspended Sub Admin"
          count={suspended.length}
          users={suspended}
          borderColor="border-red-500"
        />
      </div>

      <div className="p-4">
        <SubAdminTable
          data={admins}
          onView={(admin) => setViewData(admin)}
          onRemove={(id) => setRemoveId(id)}
        />
      </div>


      {viewData && (
        <SubAdminViewModal data={viewData} onClose={() => setViewData(null)} />
      )}

      {removeId && (
        <SubAdminRemoveModal
          onConfirm={handleRemove}
          onCancel={() => setRemoveId(null)}
          user={admins.find(a => a.id === removeId)}
        />
      )}

    </>
  );
};

export default SubAdminPage;
