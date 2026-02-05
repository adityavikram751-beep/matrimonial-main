"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../api/apiURL";
import Image from "next/image";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ------------------ BANNER STATES ------------------ */
  const [banners, setBanners] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(false);

  const limit = 10;

  /* ------------------ USERS FETCH ------------------ */
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        search,
        status: statusFilter,
        gender: genderFilter,
        page: currentPage,
        limit,
      });

      const res = await fetch(`${API_URL}/admin/getUser?${params.toString()}`);
      const data = await res.json();

      setUsers(data.data || []);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, genderFilter, currentPage]);

  /* ------------------ EXPORT CSV ------------------ */
  const handleExportCSV = () => {
    if (!users.length) return;

    const headers = Object.keys(users[0]);
    const csvRows = [];

    csvRows.push(headers.join(","));

    users.forEach((u) => {
      const row = headers.map((h) => `"${u[h]}"`);
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
  };

  /* ------------------ BANNER FETCH ------------------ */
  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/banners`);
      const data = await res.json();
      setBanners(data.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  /* ------------------ ADD BANNER ------------------ */
  const handleAddBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("banner", file);

    try {
      setBannerLoading(true);

      const res = await fetch(`${API_URL}/api/banners`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) return;

      setBanners((prev) => [...prev, ...data.data]);
    } finally {
      setBannerLoading(false);
    }
  };

  /* ------------------ UPDATE BANNER ------------------ */
  const handleUpdateBanner = async (id) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fd = new FormData();
      fd.append("banner", file);

      try {
        setBannerLoading(true);

        const res = await fetch(`${API_URL}/api/banners/${id}`, {
          method: "PUT",
          body: fd,
        });

        const data = await res.json();
        if (!res.ok) return;

        fetchBanners();
      } finally {
        setBannerLoading(false);
      }
    };

    input.click();
  };

  /* ------------------ DELETE BANNER ------------------ */
  const handleDeleteBanner = async (id) => {
    try {
      setBannerLoading(true);

      await fetch(`${API_URL}/api/banners/${id}`, {
        method: "DELETE",
      });

      setBanners((prev) => prev.filter((b) => b._id !== id));
    } finally {
      setBannerLoading(false);
    }
  };

  /* ------------------ PAGINATION ------------------ */
  const windowSize = 4;
  const start = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
  const end = Math.min(start + windowSize - 1, totalPages);

  return (
    <div className="p-4 sm:p-6 w-full overflow-x-hidden">

      {/* ---------------- USERS TABLE ---------------- */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-500 p-3 sm:p-4">

        {/* SEARCH + FILTERS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">

          {/* SEARCH BOX */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-xl bg-white shadow-sm w-full sm:w-[300px]">
            <Image src="/search.png" width={18} height={18} alt="Search" />
            <input
              type="text"
              placeholder="Search By User ID"
              className="w-full outline-none text-sm sm:text-base"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* FILTERS + EXPORT */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <select
              className="border bg-gray-200 px-3 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Status</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Blocked</option>
            </select>

            <select
              className="border bg-gray-200 px-3 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>

            {/* EXPORT CSV BUTTON */}
            <button
              onClick={handleExportCSV}
              className="px-3 sm:px-4 py-2 bg-gray-200 rounded-lg border border-gray-600 hover:bg-gray-100 text-sm sm:text-base w-full sm:w-auto"
            >
              Export CSV
            </button>
          </div>

        </div>

        {/* ---------------- TABLE ---------------- */}
        <div className="overflow-x-auto border-t border-gray-300">
          <table className="min-w-[800px] w-full text-xs sm:text-sm">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "User ID",
                  "User Name",
                  "Location",
                  "Gender",
                  "Joined",
                  "Verified",
                  "Status",
                  "Last Active",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-300 font-semibold text-gray-800 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length ? (
                users.map((user, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-3 sm:px-4 py-2 sm:py-3 truncate max-w-[120px]">{user.id}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">{user.name}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 truncate max-w-[150px]">{user.location}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">{user.gender}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">{user.joined}</td>

                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      {user.verified === "Yes" ? (
                        <span className="text-green-600">✔ Yes</span>
                      ) : (
                        <span className="text-red-600">✘ No</span>
                      )}
                    </td>

                    <td className="px-3 sm:px-4 py-2 sm:py-3 capitalize">
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                            user.status === "Approved"
                              ? "bg-green-500"
                              : user.status === "Pending"
                              ? "bg-yellow-400"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <span className="whitespace-nowrap">{user.status}</span>
                      </span>
                    </td>

                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">{user.lastActive}</td>
                  </tr> 
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ---------------- PAGINATION ---------------- */}
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 text-gray-700 text-sm sm:text-base">

          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 ${currentPage === 1 ? "text-gray-400" : "hover:underline"}`}
          >
            ◄ Prev
          </button>

          <span className="hidden sm:inline">|</span>

          {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(
            (page, idx, arr) => (
              <div key={page} className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 ${
                    page === currentPage
                      ? "font-bold underline"
                      : "hover:underline"
                  }`}
                >
                  {page}
                </button>

                {idx !== arr.length - 1 && <span className="hidden sm:inline">|</span>}
              </div>
            )
          )}

          {end < totalPages && <span className="hidden sm:inline">.....</span>}
          <span className="hidden sm:inline">|</span>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 ${
              currentPage === totalPages ? "text-gray-400" : "hover:underline"
            }`}
          >
            Next ►
          </button>
        </div>
      </div>

      {/* ---------------- BANNER SECTION ---------------- */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-500 p-4 sm:p-6 mt-6 sm:mt-10">

        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Current Images</h2>

        <div className="flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start">

          {banners.map((banner) => (
            <div
              key={banner._id}
              className="rounded-xl overflow-hidden shadow-md border border-gray-300 w-full sm:w-[280px] md:w-[300px] relative"
            >
              <div className="relative w-full h-[160px] sm:h-[180px]">
                <Image
                  src={banner.image}
                  fill
                  alt="banner"
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 300px"
                />
              </div>

              <div className="absolute bottom-0 left-0 w-full bg-white/60 backdrop-blur-md px-3 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">

                {/* EDIT BUTTON */}
                <button
                  onClick={() => handleUpdateBanner(banner._id)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 border-2 border-red-500 text-red-500 rounded-xl text-sm sm:text-base font-semibold w-full sm:w-auto"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Edit
                </button>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => handleDeleteBanner(banner._id)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 border-2 border-red-500 text-red-500 rounded-xl text-sm sm:text-base font-semibold w-full sm:w-auto"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  Delete
                </button>

              </div>
            </div>
          ))}

          {/* ADD MORE BUTTON */}
          <label className="w-full sm:w-[150px] h-[120px] sm:h-[150px] flex flex-col justify-center items-center border-4 border-[#b43f4a] text-[#b43f4a] rounded-xl sm:rounded-2xl cursor-pointer text-xl font-bold hover:bg-gray-50 transition-colors">
            +
            <span className="text-sm font-semibold mt-1">Add More</span>
            <input type="file" className="hidden" onChange={handleAddBanner} />
          </label>

        </div>
      </div>
    </div>
  );
}