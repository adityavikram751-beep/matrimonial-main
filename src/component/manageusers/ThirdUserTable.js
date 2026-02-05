'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import Papa from 'papaparse';
import { API_URL } from '../api/apiURL';

export default function UserTable() {
  const [rawUsers, setRawUsers] = useState([]); // API DATA
  const [users, setUsers] = useState([]);       // TABLE DATA (FILTERED)

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sortField, setSortField] = useState('');
  const [asc, setAsc] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const usersPerPage = 5;

  // ⭐ API FETCH (WORKS EVEN IF SEARCH NOT SUPPORTED)
  const fetchUsers = async () => {
    try {
      const url = `${API_URL}/admin/user-manage-get?search=${encodeURIComponent(
        search.trim()
      )}&name=${encodeURIComponent(
        search.trim()
      )}&status=${statusFilter.toLowerCase()}&gender=${genderFilter}&sortField=${sortField}&sortOrder=${
        asc ? 'asc' : 'desc'
      }&page=${currentPage}&limit=${usersPerPage}`;

      const res = await fetch(url);
      const data = await res.json();

      setRawUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // ⭐ Fetch on any change
  useEffect(() => {
    fetchUsers();
  }, [statusFilter, genderFilter, sortField, asc, currentPage, search]);

  // ⭐ LOCAL FILTER (GUARANTEED WORKS EVEN IF API SEARCH FAILS)
  useEffect(() => {
    const filtered = rawUsers.filter((u) =>
      u.name?.toLowerCase().includes(search.toLowerCase())
    );
    setUsers(filtered);
  }, [search, rawUsers]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setAsc(!asc);
    } else {
      setSortField(field);
      setAsc(true);
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'users.csv';
    a.click();
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return 'text-green-600';
    if (status === 'Pending') return 'text-yellow-500';
    return 'text-red-600';
  };

  const getStatusDotColor = (status) => {
    if (status === 'Approved') return 'bg-green-500';
    if (status === 'Pending') return 'bg-yellow-400';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4 border border-gray-400 w-full mt-4">

      {/* Filters */}
      <div className="flex flex-col border p-2 rounded bg-gray-100 border-gray-400 md:flex-row md:items-center justify-between gap-3 mb-4">

        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search By User Name"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2  bg-white border border-gray-300 rounded-md text-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex gap-2 items-center">

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-400 bg-gray-200 cursor-pointer hover:bg-gray-300 text-sm rounded-md px-3 py-2"
          >
            <option value="">Status</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Reject">Reject</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-400 bg-gray-200 cursor-pointer hover:bg-gray-300 text-sm rounded-md px-3 py-2"
          >
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-sm border border-gray-400 bg-gray-200 cursor-pointer hover:bg-gray-300 rounded-md flex items-center gap-1"
          >
            <Download size={16} /> Export CSV
          </button>

        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-300 text-left">

          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-2">User ID</th>
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('name')}>User Name ⬍</th>
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('location')}>Location ⬍</th>
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('gender')}>Gender ⬍</th>
              <th className="p-2 cursor-pointer" onClick={() => toggleSort('joined')}>Joined ⬍</th>
              <th className="p-2">Verified</th>
              <th className="p-2">Status</th>
              <th className="p-2">Last Active</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={index} className="border-t border-gray-300 text-gray-600">
                <td className="p-2">{user.id}</td>
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.location || 'Not Mention'}</td>
                <td className="p-2">{user.gender || 'Not Mention'}</td>
                <td className="p-2">{user.joined}</td>

                <td className="p-2">
                  {user.verified ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-6 h-6 bg-green-700 text-white rounded-sm flex items-center justify-center">✔</span>
                      Yes
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <span className="font-bold">✘ No</span>
                    </div>
                  )}
                </td>

                <td className="p-2">
                  <span className={`flex items-center gap-1 ${getStatusColor(user.status)}`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(user.status)}`}></span>
                    {user.status}
                  </span>
                </td>

                <td className="p-2">{user.lastActive}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center mt-4 text-sm text-gray-700 space-x-3">

        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-2">◄</button>

        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-2">Prev</button>

        <span>|</span>

        {(() => {
          let start = Math.max(1, currentPage - 3);
          let end = Math.min(start + 3, totalPages);

          return Array.from({ length: end - start + 1 }, (_, idx) => {
            const num = start + idx;
            return (
              <span key={num} onClick={() => setCurrentPage(num)} className={`cursor-pointer px-1 ${currentPage === num ? "font-semibold" : ""}`}>
                {num} <span>|</span>
              </span>
            );
          });
        })()}

        {totalPages > 4 && <span>…..</span>}

        <span>|</span>

        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-2">Next</button>

        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-2">►</button>

      </div>

    </div>
  );
}
