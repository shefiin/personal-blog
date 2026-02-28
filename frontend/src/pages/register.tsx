import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth.api";

type ApiError = {
  message?: string;
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password
      });

      const verifyToken = response.data.verifyToken;
      sessionStorage.setItem("verifyToken", verifyToken);
      sessionStorage.setItem("verifyEmail", email.trim());
      navigate("/verify-otp");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-cyan-50 to-white px-4 py-12">
      <section className="mx-auto max-w-md rounded-2xl border border-cyan-100 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">We will send an OTP to verify your email.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500"
              placeholder="Aarya Sharma"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500"
              placeholder="At least 6 characters"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-600">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
};

export default RegisterPage;
