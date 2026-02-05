import React, { useState ,useMemo } from 'react';
import { FaSort } from 'react-icons/fa';
import { useRouter } from 'next/router';
// import { useMemo } from 'react';


const SubAdminTable = ({ data, onView, onRemove }) => {
  const router = useRouter();
  const [search , setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 5;

const filteredAdmins= useMemo(() => {
    return data.filter((admin) => {

const matchesSearch =admin.userId.toLowerCase().includes(search.toLowerCase())
 const matchesStatus = statusFilter ? admin.status ===statusFilter : true;
 const matchrole = roleFilter ? admin.role === roleFilter:true;
 return matchesSearch && matchesStatus && matchrole;
    });
  }, [data, search, statusFilter, roleFilter]); 


const currentAdmins = filteredAdmins.slice((currentPage - 1) * adminsPerPage, currentPage * adminsPerPage);

const pageCount = Math.ceil(filteredAdmins.length / adminsPerPage);


  return (
  <div className="bg-white border border-gray-400 rounded shadow p-4">
    {/* Filters + Search */}

      <div className="flex border p-1 rounded  border-gray-400 shadow  flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
  {/* Search */}
  <input
    type="text"
    placeholder="Search by User ID"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border border-gray-300 focus:outline-0 px-3 py-2 rounded w-full sm:w-[20%]"
  />

  {/* Filters & Button */}
  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
    {/* Status Filter */}
    <select 
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border border-gray-300 bg-gray-200 cursor-pointer  p-1 rounded w-auto sm:w-auto">
      <option value="" >Status</option>
      <option value="Active"> Active</option>
      <option value="Inactive">Inactive</option>
    </select>

    {/* Role Filter */}
    <select
    value={roleFilter}
    onChange={(e)=> setRoleFilter(e.target.value)}
    
    className="border border-gray-300 bg-gray-200 px-3 cursor-pointer py-2 rounded w-full sm:w-auto">
      <option value="" >Role</option>
      <option value="Report Moderator">Report Moderator</option>
      <option value="Verification Officer">Verification Officer</option>
    </select>

    {/* Create Button */}
    {/* <button 
    onClick={()=>router.push("/createsubadmin")}
    className="bg-indigo-600 text-white px-4 py-2 rounded w-full sm:w-auto">
      Create Sub Admin
    </button> */}
  </div>
</div>

    {/* Responsive Table */}
    <div className="overflow-x-auto">
      <table className="min-w-[700px] w-full border border-gray-400 text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-3 py-2">Sub Admin <FaSort className="inline ml-1" /></th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role <FaSort className="inline ml-1" /></th>
            <th className="px-3 py-2">Last Active</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentAdmins.map((admin) => (
            <tr key={admin.id} className="border border-gray-400">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <img src={admin.avatar} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="font-semibold">{admin.name}</p>
                    <p className="text-xs text-gray-500">{admin.userId} / {admin.gender}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2">{admin.email}</td>
              <td className="px-3 py-2">{admin.role}</td>
              <td className="px-3 py-2">{admin.lastActive}</td>
              <td className="px-3 py-2">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${admin.status === 'Active' ? 'bg-green-700' : 'bg-red-500'}`}></span>
                {admin.status}
              </td>
              <td className="px-3 py-2 space-x-2">
                <button onClick={() => onView(admin)} className="text-black hover:underline">View</button>
                <button onClick={() => onRemove(admin.id)} className="text-white bg-red-500 px-2 py-1 rounded">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="text-center mt-4 flex flex-wrap justify-center gap-2">
      {Array.from({ length: pageCount }).map((_, idx) => (
        <button
          key={idx}
          className={`px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => setCurrentPage(idx + 1)}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  </div>
);
}

export default SubAdminTable;
