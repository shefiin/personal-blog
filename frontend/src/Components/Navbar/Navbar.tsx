import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
          UrbanFresh Blog
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
  
