'use client';
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../api/apiURL";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaChevronDown, FaUserShield, FaUserCog } from "react-icons/fa";

// Simple JWT decoder – works without external libraries
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("JWT decode failed:", err);
    return null;
  }
};

const ROLES = [
  {
    key: "super_admin",
    label: "Super Admin",
    icon: <FaUserShield className="text-red-500" />,
    loginEndpoint: "/api/auth/admin/login",
  },
  {
    key: "sub_admin",
    label: "Sub Admin",
    icon: <FaUserCog className="text-indigo-500" />,
    loginEndpoint: "/api/sub-admin/loginIn",
  },
];

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, reset } = useForm();

  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [phone, setPhone] = useState("");
  const [otpInput, setOtpInput] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── LOGIN with permission storage ───────────────────────────────────── */
  const handleLogin = async (data) => {
    setLoading(true);
    setApiError("");
    const input = data.identifier;
    const isEmail = input.includes("@");
    try {
      const res = await axios.post(`${API_URL}${selectedRole.loginEndpoint}`, {
        [isEmail ? "email" : "phone"]: input,
        password: data.password,
      });

      const token = res.data.token;
      if (!token) throw new Error("No token received");

      const user = parseJwt(token);
      if (!user) throw new Error("Invalid token");

      // ----- PERMISSION HANDLING -----
      let permissions = [];
      let role = selectedRole.key;

      if (selectedRole.key === "super_admin") {
        permissions = ["ALL"]; // Super admin sees everything
        role = "super_admin";
      } else if (selectedRole.key === "sub_admin") {
        permissions = res.data.subAdminPermission || [];
        role = user?.role || "sub_admin";
      }

      // Store auth data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("permissions", JSON.stringify(permissions));
      localStorage.setItem("role", role);

      // Store profile for sidebar
      const profile = {
        name: user?.name || (role === "super_admin" ? "Super Admin" : "Sub Admin"),
        profileImage: "/profile.png",
        role: role === "super_admin" ? "Super Admin" : "Sub Admin",
      };
      localStorage.setItem("admin_profile", JSON.stringify(profile));
      window.dispatchEvent(new Event("adminProfileUpdated"));

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      setApiError("Invalid email/phone or password!");
    }
    setLoading(false);
  };

  /* ── SEND OTP ───────────────────────────────────────────────────────── */
  const handleSendOtp = async (data) => {
    setLoading(true);
    setApiError("");
    try {
      const res = await axios.post(`${API_URL}/api/auth/admin/forgot-password`, {
        phone: data.phone,
      });
      if (res.data.success) {
        setPhone(data.phone);
        setStep(3);
      } else {
        setApiError("Failed to send OTP");
      }
    } catch (err) {
      setApiError("Phone not found!");
    }
    setLoading(false);
  };

  /* ── VERIFY OTP ─────────────────────────────────────────────────────── */
  const handleOtpSubmit = async () => {
    const otp = otpInput.join("");
    if (otp.length !== 4) {
      setApiError("Enter full OTP");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const res = await axios.post(`${API_URL}/api/auth/admin/verify-otp`, { phone, otp });
      if (res.data.success) setStep(4);
      else setApiError("Invalid OTP!");
    } catch (err) {
      setApiError("Wrong OTP!");
    }
    setLoading(false);
  };

  /* ── RESET PASSWORD ─────────────────────────────────────────────────── */
  const handleResetPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword)
      return setApiError("Passwords do not match");
    setLoading(true);
    setApiError("");
    try {
      const res = await axios.post(`${API_URL}/api/auth/admin/reset-password`, {
        phone,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      if (res.data.success) {
        reset();
        setStep(1);
      } else setApiError("Password reset failed!");
    } catch (err) {
      setApiError("Something went wrong!");
    }
    setLoading(false);
  };

  /* ── OTP Auto Move ──────────────────────────────────────────────────── */
  const handleOtpChange = (value, index) => {
    let temp = [...otpInput];
    temp[index] = value.slice(-1);
    setOtpInput(temp);
    if (value && index < 3) document.getElementById(`otp-${index + 1}`).focus();
  };

  /* ── UI ─────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative">
      <div
        className="absolute inset-0 bg-cover bg-center blur-lg brightness-75"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      <div className="relative z-20 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6" ref={dropdownRef}>
          <div className="relative cursor-pointer" onClick={() => setDropdownOpen((p) => !p)}>
            <img
              src="/profile.png"
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
              alt="profile"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full px-3 py-0.5 flex items-center gap-1 shadow text-xs font-semibold text-gray-700 whitespace-nowrap">
              {selectedRole.icon}
              {selectedRole.label}
              <FaChevronDown
                size={9}
                className={`ml-0.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {dropdownOpen && (
            <div className="mt-5 bg-white rounded-2xl shadow-2xl w-52 overflow-hidden border border-gray-100">
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  onClick={() => {
                    setSelectedRole(role);
                    setDropdownOpen(false);
                    setStep(1);
                    setApiError("");
                    reset();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition hover:bg-gray-50
                    ${selectedRole.key === role.key ? "bg-gray-50 text-gray-900" : "text-gray-600"}`}
                >
                  <span className="text-base">{role.icon}</span>
                  {role.label}
                  {selectedRole.key === role.key && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <h2 className="text-white text-2xl font-semibold mt-3">ADITYA</h2>
        <p className="text-gray-200 mb-8">{selectedRole.label}</p>

        <div className="w-[350px] bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/30">
          {step === 1 && (
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
              <input
                {...register("identifier", { required: true })}
                placeholder="Admin ID (Phone or Email)"
                className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
              />
              <div className="relative">
                <input
                  {...register("password", { required: true })}
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
                />
                <span onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 cursor-pointer">
                  {showPass ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </span>
              </div>
              <p onClick={() => setStep(2)} className="text-black text-sm cursor-pointer underline">
                Forgot Password?
              </p>
              {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
              <button className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg">
                {loading ? "Loading..." : `Login as ${selectedRole.label}`}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-4">
              <input
                {...register("phone", { required: true })}
                placeholder="Enter Phone Number"
                className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
              />
              {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
              <button className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg">
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <p onClick={() => setStep(1)} className="text-black text-sm cursor-pointer underline text-center">
                ← Back to Login
              </p>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {otpInput.map((v, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    maxLength={1}
                    value={v}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    className="w-14 h-14 text-center rounded-xl bg-white/90 shadow-inner text-lg"
                  />
                ))}
              </div>
              {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
              <button onClick={handleOtpSubmit} className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg">
                {loading ? "Verifying..." : "Confirm OTP"}
              </button>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="relative">
                <input
                  {...register("newPassword", { required: true })}
                  type={showResetPass ? "text" : "password"}
                  placeholder="New Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
                />
                <span onClick={() => setShowResetPass(!showResetPass)} className="absolute right-3 top-3 cursor-pointer">
                  {showResetPass ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </span>
              </div>
              <div className="relative">
                <input
                  {...register("confirmPassword", { required: true })}
                  type={showResetConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
                />
                <span onClick={() => setShowResetConfirm(!showResetConfirm)} className="absolute right-3 top-3 cursor-pointer">
                  {showResetConfirm ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </span>
              </div>
              {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
              <button className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg">
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}