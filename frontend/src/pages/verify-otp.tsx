import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { resendRegisterOtp, verifyRegisterOtp } from "../api/auth.api";

type ApiError = {
  message?: string;
};

const VerifyOtpPage = () => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const email = sessionStorage.getItem("verifyEmail") || "your email";
  const verifyToken = sessionStorage.getItem("verifyToken") || "";

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!verifyToken) {
      setError("Verification token missing. Please register again.");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyRegisterOtp(otp.trim(), verifyToken);
      setMessage(response.data.message || "Email verified successfully.");
      sessionStorage.removeItem("verifyToken");
      sessionStorage.removeItem("verifyEmail");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");

    if (!verifyToken) {
      setError("Verification token missing. Please register again.");
      return;
    }

    setResending(true);
    try {
      const response = await resendRegisterOtp(verifyToken);
      setMessage(response.data.message || "OTP resent successfully.");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-teal-50 to-white px-4 py-12">
      <section className="mx-auto max-w-md rounded-2xl border border-teal-100 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify OTP</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the 6-digit OTP sent to <span className="font-medium text-slate-800">{email}</span>.
        </p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">OTP Code</span>
            <input
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              required
              maxLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 tracking-[0.35em] outline-none transition focus:border-teal-500"
              placeholder="123456"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          type="button"
          disabled={resending}
          onClick={handleResend}
          className="mt-4 w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-600">
          Entered wrong email?{" "}
          <Link to="/register" className="font-medium text-teal-700 hover:text-teal-600">
            Register again
          </Link>
        </p>
      </section>
    </main>
  );
};

export default VerifyOtpPage;
