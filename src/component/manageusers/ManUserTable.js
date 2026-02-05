'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '../api/apiURL';

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const usersPerPage = 5;

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const query = new URLSearchParams({
        page: currentPage,
        limit: usersPerPage,
        search,
        statusFilter,
        genderFilter
      });

      const res = await fetch(`${API_URL}/admin/user-manage?${query}`);
      const data = await res.json();

      if (data.success) {
        // Map users with verification status based on their approval status
        const usersWithVerification = data.data.map(user => ({
          ...user,
          // If status is approved, show verified as Yes, otherwise No
          verified: user.status === 'approved' 
            ? 'Yes' 
            : user.status === 'pending' || user.status === 'reject' 
              ? 'No' 
              : 'No' // For blocked and other statuses
        }));
        
        setUsers(usersWithVerification);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.log("Fetch Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, statusFilter, genderFilter]);

  // --- Pagination number shifting logic (EXACT screenshot style) ---
  const getPageNumbers = () => {
    let start = Math.floor((currentPage - 1) / 4) * 4 + 1;
    let end = Math.min(start + 3, totalPages);

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="overflow-x-auto bg-white border border-gray-400 shadow-md rounded-xl p-4 mt-4 w-full">

      {/* TOP SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row md:items-center bg-gray-100 border p-2 rounded border-gray-400 justify-between gap-3 mb-4">

        {/* SEARCH */}
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search By User"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-400 rounded-md text-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        {/* FILTERS */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-400 bg-gray-200 text-sm rounded-md px-3 py-2 cursor-pointer"
          >
            <option value="">Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
            <option value="reject">Rejected</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="border border-gray-400 bg-gray-200 text-sm rounded-md px-3 py-2 cursor-pointer"
          >
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="N/A">N/A</option>
          </select>
        </div>

      </div>

      {/* LOADING */}
      {loading && (
        <p className="flex justify-center py-4">
          <Image src="/loading2.gif" width={90} height={90} alt="loading" />
        </p>
      )}

      {/* TABLE */}
      {!loading && users.length > 0 && (
        <table className="min-w-full text-sm border border-gray-300">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="p-2 border">User Name</th>
              <th className="p-2 border">Location</th>
              <th className="p-2 border">Joined</th>
              <th className="p-2 border text-center">Verified</th>
              <th className="p-2 border text-center">Last Active</th>
              <th className="p-2 border text-center">Status</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="text-gray-700">

                <td className="p-2 border">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profileImage}
                      className="w-10 h-10 rounded-full object-cover"
                      alt="avatar"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{user.fullName}</span>
                      <span className="text-xs text-gray-500">
                        {user.id} / {user.gender}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-2 border">{user.location}</td>
                <td className="p-2 border">{user.joined}</td>

                <td className="p-2 border text-center">
                  {user.verified === 'Yes' ? (
                    <span className="text-green-600 font-semibold">✔ Yes</span>
                  ) : (
                    <span className="text-red-600 font-semibold">✘ No</span>
                  )}
                </td>

                <td className="p-2 border text-center">{user.lastActive}</td>

                <td className="p-2 border text-center">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        user.status === 'approved'
                          ? 'bg-green-600'
                          : user.status === 'pending'
                          ? 'bg-yellow-500'
                          : user.status === 'blocked'
                          ? 'bg-red-600'
                          : user.status === 'reject'
                          ? 'bg-gray-500'
                          : 'bg-gray-300'
                      }`}
                    ></span>
                    <span className="font-medium capitalize">
                      {user.status}
                    </span>
                  </div>
                </td>

                <td className="p-2 border text-center">
                  <Link href={`/manageusers/${user.mongoId}`}>
                    <span className="text-black hover:underline cursor-pointer">
                      View
                    </span>
                  </Link>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* PAGINATION EXACT SCREENSHOT STYLE */}
      {!loading && (
        <div className="flex justify-center items-center mt-4 text-sm text-gray-700 space-x-2">

          {/* LEFT ARROW */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2"
          >
            ◄
          </button>

          {/* PREV */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2"
          >
            Prev
          </button>

          {/* | divider */}
          <span>|</span>

          {/* DYNAMIC PAGE NUMBERS */}
          {getPageNumbers().map((num) => (
            <span key={num} className="flex items-center">
              <button
                onClick={() => setCurrentPage(num)}
                className={
                  currentPage === num
                    ? 'font-bold underline text-black'
                    : 'text-gray-700'
                }
              >
                {num}
              </button>
              <span className="px-1">|</span>
            </span>
          ))}

          {/* DOTS */}
          {totalPages > 4 && <span>…..</span>}

          {/* NEXT */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2"
          >
            Next
          </button>

          {/* RIGHT ARROW */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2"
          >
            ►
          </button>

        </div>
      )}

    </div>
  );
}