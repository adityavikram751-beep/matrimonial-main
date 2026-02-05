import { ArrowUp, ArrowDown } from "lucide-react";

export default function ProfileStatsCard({ profileCompleted, profileIncomplete }) {
  const formatCompact = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M";
    if (n >= 1000) return (n / 1000).toFixed(1) + " K";
    return n.toString();
  };

  const StatItem = ({ title, value, change, trend }) => (
    <div className="flex-1 flex flex-col items-center text-center">

      {/* TITLE (exact screenshot size, center aligned) */}
      <div className="text-xl font-semibold text-gray-900">
        {title}
      </div>

      {/* NUMBER (exact screenshot size & weight) */}
      <div className="text-4xl font-bold text-gray-900 mt-1">
        {formatCompact(value)}
      </div>

      {/* ARROW + TEXT (center aligned 2-line) */}
      <div
        className={`flex items-center justify-center mt-2 ${
          trend === "up" ? "text-green-600" : "text-red-600"
        }`}
      >
        {trend === "up" ? (
          <ArrowUp size={30} className="mr-2" />
        ) : (
          <ArrowDown size={30} className="mr-2" />
        )}

        <div className="flex flex-col text-[15px] leading-tight font-bold">
          <span> {Math.abs(change)} % Vs</span>
          <span className="font-normal">last week</span>
        </div>
      </div>

    </div>
  );

  return (
    <div className="bg-white border border-gray-400 shadow-sm rounded-2xl px-4 py-4 w-full max-w-sm">

      <div className="flex items-center">

        {/* LEFT BLOCK */}
        <StatItem
          title="Profile Com."
          value={profileCompleted.count}
          change={profileCompleted.change}
          trend={profileCompleted.trend}
        />

        {/* DIVIDER (exact screenshot height) */}
        <div className="w-[2px] h-[75px] bg-gray-300 mx-4"></div>

        {/* RIGHT BLOCK */}
        <StatItem
          title="Profile Incom."
          value={profileIncomplete.count}
          change={profileIncomplete.change}
          trend={profileIncomplete.trend}
        />

      </div>
    </div>
  );
}
