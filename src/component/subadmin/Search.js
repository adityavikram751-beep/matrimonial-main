import React, { useState } from "react";
import { Search as SearchIcon, Bell } from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      console.log("Searching:", searchQuery);
    }
  };

  return (
    <div
      className="bg-white px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between"
      style={{
        left: "250px",                // ⭐ Sidebar width
        width: "calc(100% - 250px)", // ⭐ Bar remains beside sidebar
      }}
    >
      {/* TITLE */}
      <h1 className="text-2xl font-bold text-gray-900">
        Manage Sub Admin
      </h1>

      {/* SEARCH + BELL */}
      <div className="flex items-center gap-5">

        {/* SEARCH BAR
        <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 w-[360px] shadow-md">
          <SearchIcon className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search By User ID"
            className="ml-2 w-full outline-none text-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div> */}

        {/* BELL ICON */}
        <div className="relative">
          <Bell className="h-7 w-7" color="#FFC107" /> {/* ⭐ PURE YELLOW */}
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
        </div>

      </div>
    </div>
  );
};

export default Search;
