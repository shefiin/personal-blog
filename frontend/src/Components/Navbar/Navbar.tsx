import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type ThemeMode = "light" | "sepia" | "gray" | "dark";
type DraftSaveState = "idle" | "saving" | "saved";

type NavbarProps = {
  isAdminLoggedIn: boolean;
  onLogout: () => Promise<void>;
  logoutLoading: boolean;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  canPublish: boolean;
  publishLoading: boolean;
  onPublish: () => Promise<void>;
  draftSaveState: DraftSaveState;
};

const Navbar = ({
  isAdminLoggedIn,
  onLogout,
  logoutLoading,
  themeMode,
  onThemeChange,
  canPublish,
  publishLoading,
  onPublish,
  draftSaveState
}: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  const isWriterOrReaderPage = location.pathname.startsWith("/write");
  const isWritePage = location.pathname.startsWith("/write");
  const isHomePage = location.pathname === "/";
  const isAdminBlogsPage = location.pathname.startsWith("/admin/blogs");

  const activeTheme: ThemeMode = isWriterOrReaderPage ? themeMode : "light";
  const isDarkTheme = activeTheme === "dark";
  const isSepiaTheme = activeTheme === "sepia";
  const isGrayTheme = activeTheme === "gray";

  const handleLogout = async () => {
    await onLogout();
    setMenuOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setThemeMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const navClass = isDarkTheme
    ? "border-[#121212] bg-[#121212]"
    : isSepiaTheme
      ? "border-[#f8f1e3] bg-[#f8f1e3]"
      : isGrayTheme
        ? "border-[#5a5a5c] bg-[#5a5a5c]"
        : "border-[#FBFBFB] bg-[#FBFBFB]";

  const textClass = isDarkTheme ? "text-[#B0B0B0]" : isGrayTheme ? "text-[#C9CACA]" : "text-black";

  const actionClass = isDarkTheme
    ? "border-slate-600 text-[#B0B0B0] hover:bg-slate-800"
    : isSepiaTheme
      ? "border-[#d8cab0] text-black hover:bg-[#eee4d1]"
      : isGrayTheme
        ? "border-[#8a8a8d] text-[#C9CACA] hover:bg-[#6a6a6d]"
        : "border-slate-300 text-black hover:bg-slate-100";

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 w-full border-b backdrop-blur ${
        isDarkTheme ? "shadow-[0_6px_18px_rgba(0,0,0,0.55)]" : "shadow-[0_3px_10px_rgba(0,0,0,0.12)]"
      } ${navClass}`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className={`text-lg font-bold tracking-tight ${textClass}`}>
          Code & Context
        </Link>
        <div className="flex items-center gap-3">
          {isHomePage ? (
            <Link to="/read" className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition ${actionClass}`}>
              Start Reading
            </Link>
          ) : null}

          {isWritePage && draftSaveState !== "idle" ? (
            <span className={`text-xs ${isDarkTheme ? "text-[#B0B0B0]" : isGrayTheme ? "text-[#C9CACA]" : "text-[#707070]"}`}>
              {draftSaveState === "saving" ? "Saving..." : "Saved"}
            </span>
          ) : null}

          {isWriterOrReaderPage ? (
            <div ref={themeMenuRef} className="relative">
              <div
                className={`absolute right-full top-1/2 z-20 mr-2 flex -translate-y-1/2 gap-2 rounded-full border p-2 shadow-lg transition-all duration-200 ${
                  isDarkTheme
                    ? "border-slate-700 bg-slate-900"
                    : isSepiaTheme
                      ? "border-[#e7dcc7] bg-[#f8f1e3]"
                      : isGrayTheme
                        ? "border-[#6a6a6d] bg-[#5a5a5c]"
                        : "border-slate-200 bg-white"
                } ${themeMenuOpen ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-2 opacity-0"}`}
              >
                <button
                  type="button"
                  aria-label="Light theme"
                  onClick={() => {
                    onThemeChange("light");
                    setThemeMenuOpen(false);
                  }}
                  className={`h-7 w-7 rounded-full border border-slate-300 bg-[#FBFBFB] ${themeMode === "light" ? "ring-2 ring-emerald-500" : ""}`}
                />
                <button
                  type="button"
                  aria-label="Sepia theme"
                  onClick={() => {
                    onThemeChange("sepia");
                    setThemeMenuOpen(false);
                  }}
                  className={`h-7 w-7 rounded-full border border-[#e7dcc7] bg-[#f8f1e3] ${themeMode === "sepia" ? "ring-2 ring-emerald-500" : ""}`}
                />
                <button
                  type="button"
                  aria-label="Gray theme"
                  onClick={() => {
                    onThemeChange("gray");
                    setThemeMenuOpen(false);
                  }}
                  className={`h-7 w-7 rounded-full border border-[#7a7a7d] bg-[#5a5a5c] ${themeMode === "gray" ? "ring-2 ring-emerald-500" : ""}`}
                />
                <button
                  type="button"
                  aria-label="Dark theme"
                  onClick={() => {
                    onThemeChange("dark");
                    setThemeMenuOpen(false);
                  }}
                  className={`h-7 w-7 rounded-full border border-slate-500 bg-[#121212] ${themeMode === "dark" ? "ring-2 ring-emerald-500" : ""}`}
                />
              </div>

              <button
                type="button"
                aria-label="Theme options"
                onClick={() => setThemeMenuOpen((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white shadow-sm"
              >
                <span
                  className="h-4 w-4 rounded-full border border-slate-400"
                  style={{
                    backgroundColor:
                      themeMode === "light" ? "#FBFBFB" : themeMode === "sepia" ? "#f8f1e3" : themeMode === "gray" ? "#5a5a5c" : "#121212"
                  }}
                />
              </button>
            </div>
          ) : null}

          {isAdminLoggedIn ? (
            <>
              {!isWritePage && !isAdminBlogsPage ? (
                <Link
                  to="/admin/blogs"
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition ${actionClass}`}
                >
                  Manage
                </Link>
              ) : null}

              {isWritePage ? (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={!canPublish || publishLoading}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${actionClass}`}
                >
                  {publishLoading ? "Publishing..." : "Publish"}
                </button>
              ) : (
                <Link
                  to="/write"
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${actionClass}`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="m16.5 3.5 4 4L8 20l-5 1 1-5Z" />
                  </svg>
                  Write
                </Link>
              )}

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-label="Admin profile"
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    isDarkTheme
                      ? "bg-[#B0B0B0] text-[#121212]"
                      : isSepiaTheme
                        ? "bg-black text-[#f8f1e3]"
                      : isGrayTheme
                        ? "border border-[#C9CACA] bg-[#5a5a5c] text-[#C9CACA]"
                        : "bg-slate-900 text-white"
                  }`}
                >
                  S
                </button>

                {menuOpen ? (
                  <div
                    className={`absolute right-0 top-11 min-w-36 rounded-xl border p-1.5 shadow-lg ${
                      isDarkTheme
                        ? "border-[#2a2a2a] bg-[#121212]"
                        : isSepiaTheme
                          ? "border-[#d8cab0] bg-[#f8f1e3]"
                          : isGrayTheme
                            ? "border-[#7a7a7d] bg-[#5a5a5c]"
                            : "border-slate-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={logoutLoading}
                      className={`flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        isDarkTheme
                          ? "text-[#B0B0B0] hover:bg-[#1a1a1a]"
                          : isSepiaTheme
                            ? "text-black hover:bg-[#eee4d1]"
                          : isGrayTheme
                              ? "text-[#C9CACA] hover:bg-[#6a6a6d]"
                              : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {logoutLoading ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
