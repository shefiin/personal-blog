import { Link } from "react-router-dom";

const Home = () => {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-cyan-50 to-white px-4 py-16">
      <section className="mx-auto max-w-4xl rounded-2xl border border-emerald-100 bg-white/80 p-10 shadow-lg backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          UrbanFresh
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
          Blog Platform, Built With Microservices
        </h1>
        <p className="max-w-2xl text-slate-600">
          Start by creating your account, verify OTP from your email, and log in to continue.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-500"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
