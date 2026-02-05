'use client';
import { useForm } from "react-hook-form";
import { useState } from "react";
import axios from "axios";
import { API_URL } from "../api/apiURL";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function LoginPage() {

  // STEP FLOW
  // 1 = LOGIN (email or phone)
  // 2 = ENTER PHONE → Send OTP
  // 3 = OTP Verify
  // 4 = Reset Password
  const [step, setStep] = useState(1);

  const { register, handleSubmit, reset } = useForm();

  const [identifier, setIdentifier] = useState(""); // email OR phone
  const [phone, setPhone] = useState("");
  const [otpInput, setOtpInput] = useState(["", "", "", ""]);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  /* ======================================================
      LOGIN (Email or Phone)
  =======================================================*/
  const handleLogin = async (data) => {
    setLoading(true);
    setApiError("");

    const input = data.identifier;
    const isEmail = input.includes("@");

    try {
      const res = await axios.post(`${API_URL}/auth/admin/login`, {
        [isEmail ? "email" : "phone"]: input,
        password: data.password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/dashboard";

    } catch (err) {
      setApiError("Invalid email/phone or password!");
    }

    setLoading(false);
  };

  /* ======================================================
      SEND OTP (Phone only)
  =======================================================*/
  const handleSendOtp = async (data) => {
    setLoading(true);
    setApiError("");

    try {
      const res = await axios.post(`${API_URL}/auth/admin/forgot-password`, {
        phone: data.phone
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

  /* ======================================================
      VERIFY OTP
  =======================================================*/
  const handleOtpSubmit = async () => {
    const otp = otpInput.join("");

    if (otp.length !== 4) {
      setApiError("Enter full OTP");
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const res = await axios.post(`${API_URL}/auth/admin/verify-otp`, {
        phone,
        otp
      });

      if (res.data.success) {
        setStep(4);
      } else {
        setApiError("Invalid OTP!");
      }

    } catch (err) {
      setApiError("Wrong OTP!");
    }

    setLoading(false);
  };

  /* ======================================================
      RESET PASSWORD
  =======================================================*/
  const handleResetPassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return setApiError("Passwords do not match");
    }

    setLoading(true);
    setApiError("");

    try {
      const res = await axios.post(`${API_URL}/auth/admin/reset-password`, {
        phone,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });

      if (res.data.success) {
        reset();
        setStep(1);
      } else {
        setApiError("Password reset failed!");
      }

    } catch (err) {
      setApiError("Something went wrong!");
    }

    setLoading(false);
  };

  /* ======================================================
      OTP Auto Move
  =======================================================*/
  const handleOtpChange = (value, index) => {
    let temp = [...otpInput];
    temp[index] = value.slice(-1);
    setOtpInput(temp);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  /* ======================================================
      UI START
  =======================================================*/
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative">

      <div
        className="absolute inset-0 bg-cover bg-center blur-lg brightness-75"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      <div className="relative z-20 flex flex-col items-center">

        <img src="/profile.png" className="w-28 h-28 rounded-full border-4 border-white shadow-lg mb-4" />

        <h2 className="text-white text-2xl font-semibold">ADITYA</h2>
        <p className="text-gray-200 mb-8">Super Admin</p>

        <div className="w-[350px] bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/30">

          {/* ======================================================
              STEP 1 — LOGIN (EMAIL OR PHONE)
          =======================================================*/}
          {step === 1 && (
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">

              {/* EMAIL OR PHONE */}
              <input
                {...register("identifier", { required: true })}
                placeholder="Admin ID (Phone or Email)"
                className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
              />

              {/* PASSWORD */}
              <div className="relative">
                <input
                  {...register("password", { required: true })}
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
                />
                <span
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 cursor-pointer"
                >
                  {showPass ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </span>
              </div>

              {/* Forgot */}
              <p
                onClick={() => setStep(2)}
                className="text-black text-sm cursor-pointer underline"
              >
                Forgot Password ?
              </p>

              {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

              <button className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg">
                {loading ? "Loading..." : "Login"}
              </button>
            </form>
          )}

          {/* ======================================================
              STEP 2 — ENTER PHONE FOR OTP
          =======================================================*/}
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
            </form>
          )}

          {/* ======================================================
              STEP 3 — OTP VERIFY
          =======================================================*/}
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

              <button
                onClick={handleOtpSubmit}
                className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg"
              >
                {loading ? "Verifying..." : "Confirm OTP"}
              </button>
            </div>
          )}

          {/* ======================================================
              STEP 4 — RESET PASSWORD
          =======================================================*/}
          {step === 4 && (
            <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-4">

              {/* NEW PASSWORD */}
              <div className="relative">
                <input
                  {...register("newPassword", { required: true })}
                  type={showResetPass ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
                />
                <span
                  onClick={() => setShowResetPass(!showResetPass)}
                  className="absolute right-3 top-3 cursor-pointer"
                >
                  {showResetPass ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </span>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <input
                  {...register("confirmPassword", { required: true })}
                  type={showResetConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 rounded-xl bg-white/90 shadow-inner"
                />
                <span
                  onClick={() => setShowResetConfirm(!showResetConfirm)}
                  className="absolute right-3 top-3 cursor-pointer"
                >
                  {showResetConfirm ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </span>
              </div>

              {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

              <button className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-lg">
                {loading ? "Updating..." : "Login"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );1
}
