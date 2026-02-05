"use client";
import React, { useState } from "react";
import Search from "@/src/component/Profile details/Search";
import ProfileCard from "@/src/component/Profile details/ProfileDetails";

const profileTitles = [
  { label: "Profile For", api: "profile-for" },
  { label: "Religion", api: "religion" },
  { label: "Caste", api: "caste" },
  { label: "Communities", api: "communities" },
  { label: "Diet", api: "diet" },
  { label: "Color", api: "color" },
  { label: "Marital Status", api: "marital-status" },
  { label: "Mother Tongue", api: "mother-tongue" },
  { label: "Family Status", api: "family-status" },
  { label: "State", api: "state" },
  { label: "City", api: "city" },
  { label: "Education", api: "education" },
  { label: "Employed In", api: "employed-in" },
  { label: "Designation", api: "designation" },
];

export default function ProfilePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = profileTitles.filter((item) =>
    item.label.toLowerCase().includes(searchTerm)
  );

  return (
    <>
      <Search onSearch={setSearchTerm} />

      <div className="min-h-screen bg-gray-100 p-8 mt-[10px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <ProfileCard key={idx} title={item.label} apiPath={item.api} />
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-3">
              No matching results...
            </p>
          )}
        </div>
      </div>
    </>
  );
}
