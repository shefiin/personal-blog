import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth.api";

type ApiError = {
  message?: string;
};

type LoginPageProps = {
  onLoginSuccess: () => void;
};

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser({
        email: email.trim(),
        password
      });
      onLoginSuccess();
      navigate("/");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50 to-white px-4 py-12">
      <section className="mx-auto max-w-[350px] rounded-2xl border border-amber-100 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Log in to continue to your blog dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border max-h-9.5 border-slate-300 px-3 py-2 outline-none transition focus:border-amber-500"
                placeholder="Email"
              />
          </label>

          <label className="block">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border max-h-9.5 border-slate-300 px-3 py-2 outline-none transition focus:border-amber-500"
              placeholder="Password"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full max-h-9.5 rounded-lg bg-slate-900 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">Admin login only.</p>
      </section>
    </main>
  );
};

export default LoginPage;
