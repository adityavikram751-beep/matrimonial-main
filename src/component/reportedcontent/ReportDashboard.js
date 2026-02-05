'use client';
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import ReportedContent from './ReportedContent';
import { API_URL } from '../api/apiURL';

const ReportDashboard = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchReports = async () => {
    try {
      const res = await fetch(
        `${API_URL}/admin/report-analize?search=${searchTerm}&status=${statusFilter}&gender=${genderFilter}&page=${currentPage}&limit=${itemsPerPage}`
      );

      const data = await res.json();

      setReports(data.reports || []);
      setTotalPages(data.totalPages || 1);

    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [searchTerm, statusFilter, genderFilter, currentPage]);

  // ⭐ TOP CARDS — DATA DIRECTLY FROM TABLE DATA ⭐
  const totalReports = reports.length;

  const pendingReports = reports.filter(
    (r) => r.status?.toLowerCase() === 'pending'
  ).length;

  const reviewedReports = reports.filter(
    (r) => r.status?.toLowerCase() === 'reviewed' || r.status?.toLowerCase() === 'approved'
  ).length;

  const blockedReports = reports.filter(
    (r) => r.status?.toLowerCase() === 'blocked'
  ).length;

  const formatK = (num) =>
    num >= 1000 ? (num / 1000).toFixed(1) + ' K' : num;

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-6">

      {/* ⭐ TOP CARDS — AUTO FROM TABLE DATA ⭐ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 px-2 sm:px-4 md:px-6 lg:px-10 mb-8 sm:mb-10">
        {[
          { label: 'Total Reports This Week', value: totalReports },
          { label: 'Pending Report Review', value: pendingReports },
          { label: 'Action Taken', value: reviewedReports },
          { label: 'Blocked User', value: blockedReports },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white border border-gray-300 rounded-xl shadow-sm p-4 sm:p-5 md:p-6 flex flex-col justify-center items-center"
            style={{ minHeight: "140px" }}
          >
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 text-center px-2">{label}</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-3 sm:mt-4">{formatK(value)}</p>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER + TABLE */}
      <div className="border mt-5 p-3 sm:p-4 bg-white border-gray-400 rounded-lg sm:rounded-xl">

        {/* SEARCH BAR */}
        <div className="bg-gray-100 p-2 sm:p-3 rounded-lg shadow-sm border border-gray-400 mb-2 sm:mb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-200 text-sm sm:text-base"
              />
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="px-3 py-2 border bg-gray-300 border-gray-400 rounded-lg text-sm sm:text-base min-w-[120px]"
              >
                <option value="all">Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={genderFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setGenderFilter(e.target.value);
                }}
                className="px-3 py-2 border bg-gray-300 border-gray-400 rounded-lg text-sm sm:text-base min-w-[120px]"
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

          </div>
        </div>

        {/* TABLE */}
        <ReportedContent
          report={reports}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          refreshReports={fetchReports}
        />

      </div>

    </div>
  );
};

export default ReportDashboard;