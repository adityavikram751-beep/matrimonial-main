import { ArrowUp, User } from "lucide-react";

export default function ApprovedProfileCard({ data }) {
  const profileImages = Array.isArray(data.profileImage)
    ? data.profileImage
    : [];

  // Format 359670 => 359.67 K
  const formatCompact = (n) => {
    if (!n) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + " M";
    if (n >= 1000) return (n / 1000).toFixed(2) + " K";
    return n.toLocaleString();
  };

  return (
    <div className="relative bg-white border border-gray-400 rounded-2xl shadow-sm p-4 w-full max-w-sm">

      {/* Top Right Decoration */}
      <img
        src="/mnt/data/Frame 84.png"
        className="absolute right-3 top-3 w-20 h-10 opacity-80 pointer-events-none"
        alt=""
        onError={(e) => (e.target.style.display = "none")}
      />

      {/* HEADER */}
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-700 text-white rounded-sm text-xs font-bold">
          ✔
        </span>

        <span className="font-semibold text-gray-900 text-xl">
          Approved Profile
        </span>
      </div>

      {/* MAIN COUNT */}
      <div className="mt-2 text-4xl font-extrabold text-gray-900 leading-tight">
        {formatCompact(data.count)}
      </div>

      {/* ARROW SECTION → 2 LINES TEXT */}
      <div className="absolute right-4 top-16 flex items-start text-green-600 font-semibold">
        <ArrowUp size={32} className="mr-2" />

        <div className="flex flex-col leading-tight text-green-600 text-xl">
          <span>{data.change}% Vs</span>
          <span className="font-normal">last week</span>
        </div>
      </div>

      {/* AVATAR ROW (BOTTOM FULL WIDTH) */}
      <div className="flex -space-x-3 mt-8">
        {profileImages.length > 0 ? (
          profileImages.map((src, i) => (
            <img
              key={i}
              src={src}
              className="w-9 h-9 rounded-full border-2 border-green-600 object-cover shadow-sm"
              alt="Profile"
              onError={(e) => (e.target.style.display = "none")}
            />
          ))
        ) : (
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white text-gray-500 shadow-sm"
            >
              <User size={16} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
