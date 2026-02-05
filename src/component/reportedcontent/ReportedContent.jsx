"use client";

import React, { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import ReportModal from "./ReportModal";

/* -------------------------------
 PERFECT DIAMOND SORT ICON
----------------------------------*/
const SortArrow = ({ active, direction }) => {
  return (
    <div className="flex flex-col items-center justify-center ml-1 mt-[2px] leading-[0.4]">
      {/* UP ARROW */}
      <div
        className={`w-2 h-2 rotate-45 border-t-2 border-l-2 ${
          active && direction === "asc"
            ? "border-gray-700"
            : "border-gray-400"
        }`}
      ></div>

      {/* DOWN ARROW */}
      <div
        className={`w-2 h-2 rotate-45 border-b-2 border-r-2 mt-[3px] ${
          active && direction === "desc"
            ? "border-gray-700"
            : "border-gray-400"
        }`}
      ></div>
    </div>
  );
};

const ReportedContent = ({
  report,
  currentPage,
  totalPages,
  setCurrentPage,
  refreshReports,
}) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  /* -------------------------------
          SORTING FUNCTION
  ----------------------------------*/
  const sortBy = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* -------------------------------
             SORT LOGIC
  ----------------------------------*/
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return report;

    return [...report].sort((a, b) => {
      let x = "",
        y = "";

      switch (sortConfig.key) {
        case "reportedUser":
          x = a.reportedUser?.fullName || a.reportedUser?.name || "";
          y = b.reportedUser?.fullName || b.reportedUser?.name || "";
          break;

        case "reportDate":
          x = new Date(a.createdAt);
          y = new Date(b.createdAt);
          break;

        case "reporterUser":
          x = a.reporter?.fullName || a.reporter?.name || "";
          y = b.reporter?.fullName || b.reporter?.name || "";
          break;
      }

      if (x < y) return sortConfig.direction === "asc" ? -1 : 1;
      if (x > y) return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });
  }, [report, sortConfig]);

  /* -------------------------------
           SAFE GETTER FUNCTIONS
    ----------------------------------*/
  const getPhoto = (u) => u?.profileImage || "/default-profile.png";
  const getName = (u) => u?.fullName || u?.name || "Unknown User";
  const getId = (u) => (u?.userId ? `#${u.userId}` : "#------");
  const getGender = (u) => u?.gender || "N/A";

  const getStatusDot = (s) => {
    s = s?.toLowerCase();
    return s === "approved"
      ? "bg-green-500"
      : s === "pending"
      ? "bg-yellow-500"
      : "bg-red-500";
  };

  /* -------------------------------
                UI
  ----------------------------------*/
  return (
    <div className="bg-white  px-1">

      {/* LIGHT TOP LINE LIKE SCREENSHOT */}
      <div className="w-full h-[1px] bg-gray-500 mb-2"></div>

      <table className="w-full text-sm text-left">
        <thead>
          <tr className=" border-b border-gray-500">

            {/* REPORTED USER */}
            <th
              className="py-3 px-2 cursor-pointer font-semibold"
              onClick={() => sortBy("reportedUser")}
            >
              <div className="flex items-center gap-1">
                Reported User
                <SortArrow
                  active={sortConfig.key === "reportedUser"}
                  direction={sortConfig.direction}
                />
              </div>
            </th>

            {/* REPORT DATE */}
            <th
              className="py-3 px-2 cursor-pointer font-semibold"
              onClick={() => sortBy("reportDate")}
            >
              <div className="flex items-center gap-1">
                Report Date
                <SortArrow
                  active={sortConfig.key === "reportDate"}
                  direction={sortConfig.direction}
                />
              </div>
            </th>

            {/* REPORTER USER */}
            <th
              className="py-3 px-2 cursor-pointer font-semibold"
              onClick={() => sortBy("reporterUser")}
            >
              <div className="flex items-center gap-1">
                Reporter User
                <SortArrow
                  active={sortConfig.key === "reporterUser"}
                  direction={sortConfig.direction}
                />
              </div>
            </th>

            <th className="py-3 px-2 font-semibold">Reason</th>
            <th className="py-3 px-2 font-semibold">Status</th>
            <th className="py-3 px-2 font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody>
          {sortedData.map((item) => (
            <tr
              key={item._id}
              className="border-t border-gray-300 hover:bg-gray-50 transition"
            >
              {/* REPORTED USER */}
              <td className="py-[14px] px-3 align-middle">
                <div className="flex items-center gap-3">
                  <img
                    src={getPhoto(item.reportedUser)}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">
                      {getName(item.reportedUser)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getId(item.reportedUser)} /{" "}
                      {getGender(item.reportedUser)}
                    </div>
                  </div>
                </div>
              </td>

              {/* REPORT DATE */}
              <td className="py-[14px] px-3 align-middle">
                {new Date(item.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </td>

              {/* REPORTER USER */}
              <td className="py-[14px] px-3 align-middle">
                <div className="flex items-center gap-3">
                  <img
                    src={getPhoto(item.reporter)}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">
                      {getName(item.reporter)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getId(item.reporter)} / {getGender(item.reporter)}
                    </div>
                  </div>
                </div>
              </td>

              {/* REASON */}
              <td className="py-[14px] px-3 align-middle">
                {item.title}
              </td>

              {/* STATUS */}
              <td className="py-[14px] px-3 align-middle">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${getStatusDot(
                      item.status
                    )}`}
                  ></span>
                  <span>{item.status}</span>
                </div>
              </td>

              {/* ACTIONS */}
              <td className="py-[14px] px-3 align-middle">
                <div className="flex items-center gap-3">
                  {/* <button className="bg-red-500 text-white px-4 py-1 rounded">
                    Reject
                  </button>

                  <button className="bg-green-600 text-white px-4 py-1 rounded">
                    Approve
                  </button> */}

                  <button
                    className="text-gray-700"
                    onClick={() => setSelectedReport(item)}
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION EXACTLY LIKE SCREENSHOT */}
      <div className="flex justify-center items-center gap-3 mt-4 text-sm">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          ◀ Prev
        </button>

        {[...Array(totalPages)].map((_, p) => (
          <button
            key={p}
            onClick={() => setCurrentPage(p + 1)}
            className={`${
              currentPage === p + 1
                ? "font-bold underline"
                : "text-gray-600"
            }`}
          >
            {p + 1}
          </button>
        ))}

        <span>.....</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next ▶
        </button>
      </div>

      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          refreshReports={refreshReports}
        />
      )}
    </div>
  );
};

export default ReportedContent;
