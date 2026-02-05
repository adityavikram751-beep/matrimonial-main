import React from 'react';
import { API_URL } from '../api/apiURL';

const ReportModal = ({ report, onClose, refreshReports }) => {
  if (!report) return null;

  const {
    reporter,
    reportedUser,
    title,
    description,
    image,
    status,
    createdAt,
  } = report;

  const formatDate = (date) => new Date(date).toLocaleDateString();

  // Close when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target.id === "backdrop") {
      onClose();
    }
  };

  // API call
  const handleAction = async (action) => {
    try {
      const res = await fetch(`${API_URL}/admin/report/status/${report._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
        }),
      });

      const data = await res.json();
      console.log("API Response:", data);

      if (data.success) {
        alert(`Report has been ${action === "approve" ? "approved" : "rejected"}`);
        onClose();
        refreshReports();
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error in handleAction:", err);
      alert("Error processing action");
    }
  };

  return (
    <div
      id="backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-10"
    >
      <div
        className="relative bg-white/90 backdrop-blur-lg border border-white/40 rounded-3xl shadow-2xl max-w-xl w-full p-8 animate-scaleIn"
        onClick={(e) => e.stopPropagation()} // Stop click inside modal
      >

        {/* Status + Date */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                status === 'rejected'
                  ? 'bg-red-500'
                  : status === 'approved'
                  ? 'bg-green-500'
                  : 'bg-yellow-400'
              }`}
            />
            <span className="text-sm font-medium capitalize text-gray-800">
              {status}
            </span>
          </div>
          <span className="text-sm text-gray-600">
            Reported on: {formatDate(createdAt)}
          </span>
        </div>

        {/* Reporter + Reported */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {[reportedUser, reporter].map((user, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center text-center hover:shadow-md transition"
            >
              <img
                src={
                  user?.avatar ||
                  user?.profileImage ||
                  '/default-profile.png'
                }
                alt="User"
                className="w-20 h-20 rounded-full border object-cover shadow"
              />
              <h3 className="font-semibold text-lg text-gray-800 mt-3">
                {user?.name || user?.fullName || 'Unnamed User'}
              </h3>
              <p className="text-xs text-blue-500 mt-1">
                {idx === 1 ? 'Reporter' : 'Reported User'}
              </p>
            </div>
          ))}
        </div>

        {/* Reason + Description */}
        <div className="mb-4">
          <h4 className="font-semibold text-base mb-1">Reason:</h4>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-100 border border-gray-200 rounded-lg p-4 mt-1">
            {title}
          </p>

          <h4 className="font-semibold text-base mb-1 mt-4">Description:</h4>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-100 border border-gray-200 rounded-lg p-4 mt-1">
            {description}
          </p>
        </div>

        {/* Attached Images */}
        {image?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              Attached Screenshot{image.length > 1 ? 's' : ''}:
            </h4>
            <div className="flex flex-wrap gap-2">
              {image.map((img, idx) => (
                <a
                  key={idx}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition"
                >
                  📎 Screenshot_{idx + 1}.jpg
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Approve / Reject Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => handleAction('approve')}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-semibold shadow"
          >
            Approve
          </button>

          <button
            onClick={() => handleAction('reject')}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full font-semibold shadow"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Animation */}
      <style jsx>{`
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes scaleIn {
          0% {
            transform: scale(0.95);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportModal;
