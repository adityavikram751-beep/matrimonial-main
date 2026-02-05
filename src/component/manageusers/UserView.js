'use client';
import React, { useState } from 'react';
import Image from 'next/image';

const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";

const UserDetailCard = ({ user }) => {
  const [currentUser, setCurrentUser] = useState(user);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d)) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  /* ------------------------------
        APPROVE / REJECT API
  ------------------------------- */
  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${BASE_URL}/admin/user-verify/${currentUser._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ adminApprovel: status }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Status updated successfully!");
        setCurrentUser(data.user); // Update UI immediately
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch (error) {
      console.log(error);
      alert("API error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-100">

      {/* TOP PROFILE */}
      <div className="flex items-center space-x-6 mb-10">
        <div className="flex flex-col items-center relative">
          <img
            src={currentUser.profileImage || '/default-avatar.png'}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover border"
          />

          <span
            className={`mt-2 px-4 py-1 rounded-full text-sm font-semibold capitalize 
              ${currentUser.adminApprovel === 'approved'
                ? 'bg-green-600 text-white'
                : currentUser.adminApprovel === 'reject'
                ? 'bg-red-700 text-white'
                : 'bg-yellow-600 text-white'
              }`}
          >
            {currentUser.adminApprovel}
          </span>
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold">
            {currentUser.firstName} {currentUser.lastName}
          </h2>

          <p className="text-gray-500 text-lg font-medium">
            #{currentUser._id?.slice(-6)} / {currentUser.gender}
          </p>

          <p className="flex items-center gap-2 text-gray-600 text-lg mt-1 font-medium">
            <Image src="/location.png" width={18} height={20} alt="Location" />
            {currentUser.city}
          </p>
        </div>
      </div>

      {/* PERSONAL INFORMATION */}
      <SectionBox
        title="Personal Information"
        twoColumn
        data={[
          ['Full Name', `${currentUser.firstName} ${currentUser.lastName}`],
          ['Education', currentUser.highestEducation],
          ['DOB', formatDate(currentUser.dateOfBirth)],
          ['Profession', currentUser.designation || currentUser.employedIn],
          ['Gender', currentUser.gender],
          ['Income Range', currentUser.annualIncome],
          ['Marital Status', currentUser.maritalStatus],
          ['Height', currentUser.height],
          ['Religion', currentUser.religion],
          ['Mother Tongue', currentUser.motherTongue],
        ]}
      />

      {/* FAMILY + CAREER */}
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <SectionBox
          title="Family Background"
          data={[
            ['Father Occ', currentUser.fatherOccupation],
            ['Mother Occ', currentUser.motherOccupation],
            ['Family Inc', currentUser.familyIncome],
            ['Brother', currentUser.brother || '0'],
            ['Family Type', currentUser.familyType],
          ]}
        />

        <SectionBox
          title="Career, Education"
          data={[
            ['Post Grad', currentUser.postGraduation],
            ['Under Grad', currentUser.underGraduation],
            ['Employee In', currentUser.employedIn],
            ['Profession', currentUser.designation || currentUser.employedIn],
            ['Company', currentUser.company],
          ]}
        />
      </div>

      {/* LIFESTYLE & HOBBIES */}
      <div className="mt-8">
        <SectionBox
          title="Lifestyle & Hobbies"
          twoColumn
          data={[
            ['Dietary Habit', currentUser.diet],
            ['Hobbies', currentUser.hobbies?.join(', ') || 'N/A'],
            ['Drinking Habit', currentUser.drinking],
            ['Sports', currentUser.sports?.join(', ') || 'N/A'],
            [
              'Assets',
              `${currentUser.ownCar ? 'own a car' : ''}${
                currentUser.ownCar && currentUser.ownHouse ? ', ' : ''
              }${currentUser.ownHouse ? 'house' : ''}` || 'N/A'
            ],
            ['Interest', currentUser.interests?.join(', ') || 'N/A'],
            ['Fav Vacation', currentUser.vacationDestination?.join(', ') || 'N/A'],
            ['Fav Cuisine', currentUser.cuisine?.join(', ') || 'N/A'],
            ['Fav Movie', currentUser.movies?.join(', ') || 'N/A'],
            ['Fav Color', currentUser.favoriteColor || 'N/A'],
          ]}
        />
      </div>

      {/* APPROVE / REJECT BUTTONS */}
      <div className="mt-12 flex justify-center gap-6">
        <button
          onClick={() => updateStatus("approved")}
          className="px-6 py-2 bg-green-600 text-white text-lg rounded-md shadow hover:bg-green-700"
        >
          Approve
        </button>

        <button
          onClick={() => updateStatus("reject")}
          className="px-6 py-2 bg-red-600 text-white text-lg rounded-md shadow hover:bg-red-700"
        >
          Reject
        </button>
      </div>

    </div>
  );
};

/* ================= SECTION BOX ================= */
const SectionBox = ({ title, data, twoColumn = false }) => {
  const rows = twoColumn
    ? data.reduce((acc, cur, i) => {
        if (i % 2 === 0) acc.push([cur, data[i + 1]]);
        return acc;
      }, [])
    : data;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-400">
      {title && (
        <h3 className="text-xl font-semibold mb-4 text-gray-900">{title}</h3>
      )}

      <table className="w-full text-gray-700 text-[15px] border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left border-b border-gray-400">
            <th className="p-3 font-medium border-r border-gray-300">Data</th>
            <th className="p-3 font-medium border-r border-gray-300">Info</th>

            {twoColumn && (
              <>
                <th className="p-3 font-medium border-r border-gray-300">Data</th>
                <th className="p-3 font-medium">Info</th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
          {twoColumn
            ? rows.map((pair, i) => (
                <tr key={i} className="border-t border-gray-300">
                  <td className="p-3 border-r border-gray-300">
                    {pair[0]?.[0]}
                  </td>
                  <td className="p-3 border-r border-gray-300">
                    {pair[0]?.[1] || 'N/A'}
                  </td>

                  <td className="p-3 border-r border-gray-300">
                    {pair[1]?.[0] || ''}
                  </td>
                  <td className="p-3">{pair[1]?.[1] || 'N/A'}</td>
                </tr>
              ))
            : rows.map(([label, value], i) => (
                <tr key={i} className="border-t border-gray-300">
                  <td className="p-3 border-r border-gray-300">{label}</td>
                  <td className="p-3">{value || 'N/A'}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserDetailCard;
