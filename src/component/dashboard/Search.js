import React, { useState } from 'react';
import { Search as SearchIcon, Bell } from 'lucide-react';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      console.log('Search triggered for:', searchQuery);
   
    }
  };

  return (
    // TODO responsive header
    // < className="w-full bg-red-800 px-4 py-1 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b-2 border-gray-200 pb-3">
        {/* Title */}
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">
          Dashboard
        </h1>

        {/* Right section: bell + (optional) search */}
        <div className="flex items-center gap-4">
          {/*  (uncomment if needed) */}
          {/* <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search By User ID"
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
            />
            <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          </div> */}

          {/* Bell Notification */}
          {/* <div className="relative">
            <Bell className="h-6 w-6 text-yellow-500" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
          </div> */}
        </div>
      </div>
    
  );
};

export default Search;
