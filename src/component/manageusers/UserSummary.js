import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({ totalUsers, newSignups }) {
  const formatNumber = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + " M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + " K";
    return num.toLocaleString();
  };

  const ChangeIndicator = ({ change, trend }) => {
    const isUp = trend === "up";

    return (
      <div className="flex items-start gap-[6px] mt-[6px]">
        {isUp ? (
          <ArrowUp size={30} className="text-green-600 mt-[2px]" />
        ) : (
          <ArrowDown size={30} className="text-red-600 mt-[2px]" />
        )}

        <div className="flex flex-col leading-[15px]">
          <span
            className={`text-[16px] font-semibold ${
              isUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {Math.abs(change)} % Vs
          </span>

          <span
            className={`text-[15px] ${
              isUp ? "text-green-600" : "text-red-600"
            }`}
          >
            last week
          </span>
        </div>
      </div>
    );
  };

  const StatItem = ({ title, value, change, trend }) => (
    <div className="flex-1 text-center">
      <div className="text-[18px] font-bold text-gray-700 whitespace-nowrap">
        {title}
      </div>

      <div className="text-[32px] font-bold text-gray-900">
        {formatNumber(value)}
      </div>

      <ChangeIndicator change={change} trend={trend} />
    </div>
  );

  return (
    <div className="bg-white border border-gray-400 shadow rounded-xl px-6 py-4 w-full max-w-md">
      <div className="flex items-center justify-between">
        <StatItem
          title="Total users"
          value={totalUsers.count}
          change={totalUsers.change}
          trend={totalUsers.trend}
        />

        <div className="w-[2px] h-[60px] bg-gray-300 mx-2"></div>

        <StatItem
          title="New Signups"
          value={newSignups.count}
          change={newSignups.change}
          trend={newSignups.trend}
        />
      </div>
    </div>
  );
}
