"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search as SearchIcon, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Search from "@/src/component/varificationrequest/Search";
import { API_URL } from "../api/apiURL";

/* USER AVATAR COMPONENT */
const UserAvatar = ({ user }) => {
  const initials =
    (user.firstName?.[0] || "").toUpperCase() +
    (user.lastName?.[0] || "").toUpperCase();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {user.profileImage ? (
        <img
          src={user.profileImage}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
          alt={`${user.firstName} ${user.lastName}`}
        />
      ) : (
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold">
          {initials}
        </div>
      )}

      <div>
        <p className="font-semibold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-gray-500">
          #{user.id || user._id?.slice(-6)} / {user.gender || "Not Mentioned"}
        </p>
      </div>
    </div>
  );
};

/* STATUS COLORS */
const getStatusDot = (status) =>
  ({
    approved: "bg-green-500",
    pending: "bg-yellow-500",
    reject: "bg-red-500",
  }[status] || "bg-gray-400");

const getStatusText = (status) =>
  ({
    approved: "text-green-600",
    pending: "text-yellow-600",
    reject: "text-red-600",
  }[status] || "text-gray-600");

/* DOCUMENT POPUP */
const DocumentPopup = ({ user, onClose }) => {
  if (!user) return null;

  const closeBg = (e) => {
    if (e.target.id === "popup-bg") onClose();
  };

  return (
    <div
      id="popup-bg"
      onClick={closeBg}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[900] p-4"
    >
      <div className="bg-white w-full max-w-[280px] sm:w-[260px] rounded-xl shadow-xl p-4 animate-fadeIn">
        <h3 className="text-center font-semibold text-sm mb-3">
          Documents Uploaded
        </h3>

        <div className="max-h-[300px] overflow-y-auto space-y-3">
          {user.adhaarCard?.frontImage && (
            <div className="border rounded-xl shadow p-2">
              <img
                src={user.adhaarCard.frontImage}
                className="w-full rounded-md"
                alt="Aadhar Front"
              />
              <p className="text-center text-xs mt-1 font-medium">
                Aadhar Front
              </p>
            </div>
          )}

          {user.adhaarCard?.backImage && (
            <div className="border rounded-xl shadow p-2">
              <img
                src={user.adhaarCard.backImage}
                className="w-full rounded-md"
                alt="Aadhar Back"
              />
              <p className="text-center text-xs mt-1 font-medium">
                Aadhar Back
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-black text-white rounded-md py-2 sm:py-1.5 mt-3 text-xs sm:text-xs"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* MAIN COMPONENT */
export default function UserModerationDashboard() {
  const [users, setUsers] = useState([]);
  const [popupUser, setPopupUser] = useState(null);

  const [search, setSearch] = useState("");
  const [topSearch, setTopSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  const [status, setStatus] = useState("Status");
  const [gender, setGender] = useState("Gender");

  const [loading, setLoading] = useState(true);

  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const [stats, setStats] = useState({
    totalRequestsThisWeek: 0,
    pendingVerification: 0,
    approvedThisWeek: 0,
    rejectedDueToMismatch: 0,
  });

  /* FETCH USERS & STATS */
  useEffect(() => {
    const load = async () => {
      try {
        // USERS
        const res = await fetch(`${API_URL}/admin/user-verify`);
        const json = await res.json();
        setUsers(json.data);

        // TOP 4 BOX STATS
        const statsRes = await fetch(
          "https://matrimonial-backend-7ahc.onrender.com/admin/WeeklyRequestStats"
        );
        const statsJson = await statsRes.json();
        setStats(statsJson.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* SORTING */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /* FILTER + SORT */
  const filtered = useMemo(() => {
    let data = [...users];

    if (search) {
      data = data.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          u._id?.includes(search)
      );
    }

    if (status !== "Status") {
      data = data.filter((u) => u.adminApprovel === status);
    }

    if (gender !== "Gender") {
      data = data.filter((u) => u.gender === gender);
    }

    if (sortField === "name") {
      data.sort((a, b) =>
        sortDirection === "asc"
          ? `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`
            )
          : `${b.firstName} ${b.lastName}`.localeCompare(
              `${a.firstName} ${a.lastName}`
            )
      );
    }

    if (sortField === "date") {
      data.sort((a, b) =>
        sortDirection === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return data;
  }, [users, search, status, gender, sortField, sortDirection]);

  /* PAGINATION SLIDING WINDOW */
  const totalPages = Math.ceil(filtered.length / perPage);

  const pageWindow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = startPage + pageWindow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - pageWindow + 1);
  }

  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) visiblePages.push(i);

  const pageData = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
      {/* TOP SEARCH */}
      <Search
        setSearch={setSearch}
        topSearch={topSearch}
        setTopSearch={setTopSearch}
      />

      <div className="pt-4 sm:pt-6">
        {/* TOP 4 CARDS WITH LIVE API - RESPONSIVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-20 mb-8 sm:mb-10">
          {[
            ["Total Request This Week", stats.totalRequestsThisWeek],
            ["Pending Verification", stats.pendingVerification],
            ["Approved This Week", stats.approvedThisWeek],
            ["Rejected Due To Mismatch", stats.rejectedDueToMismatch],
          ].map(([label, val]) => (
            <div
              key={label}
              className="w-full bg-white border p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow"
            >
              <p className="text-sm sm:text-base font-semibold text-center break-words">{label}</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-center mt-2">{val}</h2>
            </div>
          ))}
        </div>

        {/* MAIN TABLE */}
        <div className="w-full mx-auto p-3 sm:p-4 md:p-5 border rounded-xl sm:rounded-2xl bg-white shadow">
          {/* FILTER BAR */}
          <div className="bg-gray-100 border rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="relative bg-white w-full sm:w-[300px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 sm:w-5" />
              <input
                placeholder="Search By User ID"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 sm:pl-10 pr-3 py-2 border rounded-lg text-xs sm:text-sm"
              />
            </div>

            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="border px-3 py-2 bg-gray-200 rounded-md text-xs sm:text-sm w-full sm:w-auto"
              >
                <option>Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="reject">Rejected</option>
              </select>

              <select
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  setCurrentPage(1);
                }}
                className="border px-3 py-2 bg-gray-200 rounded-md text-xs sm:text-sm w-full sm:w-auto"
              >
                <option>Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto mt-4 sm:mt-5 rounded-xl border">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            ) : (
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F7F7F7] text-gray-700">
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold border-b whitespace-nowrap">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 w-full text-left"
                      >
                        Reported User
                        {sortField === "name"
                          ? sortDirection === "asc"
                            ? "▲"
                            : "▼"
                          : "▲"}
                      </button>
                    </th>

                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold border-b whitespace-nowrap">
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 w-full text-left"
                      >
                        Report Date
                        {sortField === "date"
                          ? sortDirection === "asc"
                            ? "▲"
                            : "▼"
                          : "▲"}
                      </button>
                    </th>

                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold border-b whitespace-nowrap">
                      Documents Submitted
                    </th>

                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold border-b whitespace-nowrap">
                      Status
                    </th>

                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left font-semibold border-b whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {pageData.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <UserAvatar user={user} />
                      </td>

                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm">
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                        {user.adhaarCard?.frontImage || user.adhaarCard?.backImage
                          ? "Aadhar Card"
                          : "No Document Submitted"}
                      </td>

                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getStatusDot(
                              user.adminApprovel
                            )}`}
                          ></span>
                          <span className={getStatusText(user.adminApprovel)}>
                            {user.adminApprovel}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <button
                          onClick={() => setPopupUser(user)}
                          className="flex items-center gap-1 text-blue-700 text-xs sm:text-sm"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-center mt-4 items-center gap-2 sm:gap-3">
            {/* PREV */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-gray-700 disabled:opacity-40 text-xs sm:text-sm flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* SLIDING PAGE NUMBERS */}
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              {visiblePages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 flex items-center justify-center ${
                    currentPage === page
                      ? "font-bold text-black underline"
                      : "text-gray-600"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* NEXT */}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="text-gray-700 disabled:opacity-40 text-xs sm:text-sm flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* POPUP */}
        {popupUser && (
          <DocumentPopup user={popupUser} onClose={() => setPopupUser(null)} />
        )}
      </div>
    </div>
  );
}