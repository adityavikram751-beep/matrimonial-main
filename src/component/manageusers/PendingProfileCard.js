import { ArrowDown, MoreHorizontal } from "lucide-react";

export default function PendingProfileCard({ data }) {
  const images = Array.isArray(data.profileImage) ? data.profileImage : [];

  const formatCount = (value) => {
    if (value >= 1000000) return (value / 1_000_000).toFixed(2) + " M";
    if (value >= 1000) return (value / 1000).toFixed(2) + " K";
    return value;
  };

  return (
    <div className="bg-white border border-gray-400 rounded-xl shadow-sm px-5 py-4 w-full max-w-sm">

      {/* Title Row */}
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center">
          <MoreHorizontal size={14} className="text-white" />
        </div>

        <span className="font-bold text-gray-900 text-xl">
          Pending Profile
        </span>
      </div>

      {/* Value + % */}
      <div className="flex items-center justify-between mt-2">

        {/* Big Value */}
        <div className="text-4xl font-bold text-gray-900">
          {formatCount(data.count)}
        </div>

        {/* Right side – ALWAYS RED, ALWAYS DOWN ARROW */}
        <div className="flex flex-col items-end leading-tight text-red-600">
          <div className="flex items-center font-bold text-xl">
            <ArrowDown size={34} className="mr-1" />
            <span>{Math.abs(data.change)} % Vs</span>
          </div>

          <span className="text-xl">last week</span>
        </div>
      </div>
      

      {/* Profile images row */}
      <div className="flex items-center mt-4 -space-x-2">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="profile"
            className="w-9 h-9 rounded-full border-2 border-red-600 object-cover shadow"
            onError={(e) => (e.target.style.display = "none")}
          />
        ))}
      </div>

    </div>
  );
}
