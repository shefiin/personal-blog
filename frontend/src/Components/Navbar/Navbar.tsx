import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
          UrbanFresh Blog
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
  
