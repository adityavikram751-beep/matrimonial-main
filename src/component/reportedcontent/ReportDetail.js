

import React from 'react';

const ReportDetailCard = ({ report, onUpdateStatus }) => {
  return (
    <div className="bg-white  shadow rounded p-6">
      <div className="flex gap-8 mb-4">
        <div>
          <p className="font-semibold">Reported User:</p>
          <p>{report.reportedUser.name}</p>
        </div>
        <div>
          <p className="font-semibold">Reporter:</p>
          <p>{report.reporterUser.name}</p>
        </div>
        <div>
          <p className="font-semibold">Date:</p>
          <p>{report.reportDate}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="font-semibold">Reason:</p>
        <p>{report.reason}</p>
      </div>

      <div className="mb-4">
        <p className="font-semibold">Description:</p>
        <p>{report.description}</p>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => onUpdateStatus('Approved')}
          disabled={report.status === 'Approved'}
        >
          Approve
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={() => onUpdateStatus('Rejected')}
          disabled={report.status === 'Rejected'}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default ReportDetailCard;
