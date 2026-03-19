import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Spinner from "../common/Spinner";

type ThemeMode = "light" | "sepia" | "gray" | "dark";
type DraftSaveState = "idle" | "saving" | "saved";

type NavbarProps = {
  isAdminLoggedIn: boolean;
  isUserLoggedIn: boolean;
  userName: string;
  userEmail: string;
  userJoinedAt: string;
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
  isUserLoggedIn,
  userName,
  userEmail,
  userJoinedAt,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const isThemePage = location.pathname.startsWith("/write") || location.pathname.startsWith("/blog/");
  const isWritePage = location.pathname.startsWith("/write");
  const isHomePage = location.pathname === "/";
  const isPublicReadingPage = isHomePage || location.pathname.startsWith("/read") || location.pathname.startsWith("/blog/");
  const isAdminBlogsPage = location.pathname.startsWith("/admin/blogs");
  const currentPath = `${location.pathname}${location.search}${location.hash}`;

  const activeTheme: ThemeMode = isThemePage ? themeMode : "light";
  const isDarkTheme = activeTheme === "dark";
  const isSepiaTheme = activeTheme === "sepia";
  const isGrayTheme = activeTheme === "gray";

  const handleLogout = async () => {
    await onLogout();
    setMenuOpen(false);
    setMobileMenuOpen(false);
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
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
  const dropdownClass = isDarkTheme
    ? "border-[#2a2a2a] bg-[#121212]"
    : isSepiaTheme
      ? "border-[#d8cab0] bg-[#f8f1e3]"
      : isGrayTheme
        ? "border-[#7a7a7d] bg-[#5a5a5c]"
        : "border-slate-200 bg-white";
  const dropdownItemClass = isDarkTheme
    ? "text-[#B0B0B0] hover:bg-[#1a1a1a]"
    : isSepiaTheme
      ? "text-black hover:bg-[#eee4d1]"
      : isGrayTheme
        ? "text-[#C9CACA] hover:bg-[#6a6a6d]"
        : "text-slate-700 hover:bg-slate-100";
  const themeButtonBaseClass = "h-7 w-7 rounded-full border";
  const userInitial = (userName.trim().charAt(0) || "U").toUpperCase();
  const adminInitial = "S";
  const joinedDate = userJoinedAt
    ? new Date(userJoinedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "";
  const profileModalCardClass = isDarkTheme
    ? "border-[#2a2a2a] bg-[#121212] text-[#B0B0B0]"
    : isSepiaTheme
      ? "border-[#d8cab0] bg-[#f8f1e3] text-black"
      : isGrayTheme
        ? "border-[#7a7a7d] bg-[#5a5a5c] text-[#C9CACA]"
        : "border-slate-200 bg-white text-slate-900";
  const profileLabelClass = isDarkTheme ? "text-[#8d8d8d]" : isGrayTheme ? "text-[#d9d9da]" : "text-[#6B6B6B]";

  return (
    <>
      {profileModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
          <div className={`font-jakarta relative w-full max-w-md rounded-lg border px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)] ${profileModalCardClass}`}>
            <button
              type="button"
              aria-label="Close profile modal"
              onClick={() => setProfileModalOpen(false)}
              className={`absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full transition ${dropdownItemClass}`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold ${
                  isDarkTheme
                    ? "bg-[#B0B0B0] text-[#121212]"
                    : isSepiaTheme
                      ? "bg-black text-[#f8f1e3]"
                      : isGrayTheme
                        ? "border border-[#C9CACA] bg-[#5a5a5c] text-[#C9CACA]"
                        : "bg-slate-900 text-white"
                }`}
              >
                {userInitial}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{userName || "User"}</h2>
                <p className={`mt-1 text-sm ${profileLabelClass}`}>{userEmail}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className={`text-xs font-medium uppercase tracking-[0.18em] ${profileLabelClass}`}>Joined</p>
                <p className="mt-1 text-sm">{joinedDate || "-"}</p>
              </div>
              <div>
                <p className={`text-xs font-medium uppercase tracking-[0.18em] ${profileLabelClass}`}>Saved</p>
                <Link
                  to="/saved"
                  onClick={() => setProfileModalOpen(false)}
                  className="mt-1 inline-flex text-sm font-medium text-black underline underline-offset-4"
                >
                  Saved articles
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className={`fixed left-0 right-0 top-0 z-50 w-full border-b backdrop-blur ${
          isDarkTheme ? "shadow-[0_6px_18px_rgba(0,0,0,0.55)]" : "shadow-[0_3px_10px_rgba(0,0,0,0.12)]"
        } ${navClass}`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className={`font-jakarta text-lg font-bold tracking-tight ${textClass}`}>
          Code & Context
        </Link>
        <div className="hidden items-center gap-3 md:flex">
          {isHomePage ? (
            <Link to="/read" className={`font-jakarta inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition ${actionClass}`}>
              Start Reading
            </Link>
          ) : null}


          {isWritePage && draftSaveState !== "idle" ? (
            <span className={`font-jakarta inline-flex items-center gap-1.5 text-xs ${isDarkTheme ? "text-[#B0B0B0]" : isGrayTheme ? "text-[#C9CACA]" : "text-[#707070]"}`}>
              {draftSaveState === "saving" ? <Spinner className="h-3 w-3" /> : null}
              <span>{draftSaveState === "saving" ? "Saving" : "Saved"}</span>
            </span>
          ) : null}

          {isThemePage ? (
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

          {!isAdminLoggedIn && !isUserLoggedIn && isPublicReadingPage ? (
            <Link
              to="/login"
              state={{ from: currentPath }}
              className="font-jakarta inline-flex items-center rounded-full border border-black bg-black px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#222]"
            >
              Login
            </Link>
          ) : null}

          {isAdminLoggedIn ? (
            <>
              {!isWritePage && !isAdminBlogsPage ? (
                <Link
                  to="/admin/blogs"
                  className={`font-jakarta inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition ${actionClass}`}
                >
                  Manage
                </Link>
              ) : null}

              {isWritePage ? (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={!canPublish || publishLoading}
                  className={`font-jakarta inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${actionClass}`}
                >
                  {publishLoading ? <Spinner className="h-4 w-4" /> : null}
                  <span>Publish</span>
                </button>
              ) : (
                <Link
                  to="/write"
                  className={`font-jakarta inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${actionClass}`}
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
                  className={`font-jakarta flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    isDarkTheme
                      ? "bg-[#B0B0B0] text-[#121212]"
                      : isSepiaTheme
                        ? "bg-black text-[#f8f1e3]"
                      : isGrayTheme
                        ? "border border-[#C9CACA] bg-[#5a5a5c] text-[#C9CACA]"
                        : "bg-slate-900 text-white"
                  }`}
                >
                  {adminInitial}
                </button>

                {menuOpen ? (
                  <div
                    className={`absolute right-0 top-11 min-w-36 rounded-xl border p-1.5 shadow-lg ${dropdownClass}`}
                  >
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={logoutLoading}
                      className={`font-jakarta flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${dropdownItemClass}`}
                    >
                      {logoutLoading ? <Spinner className="h-4 w-4" /> : null}
                      <span>Logout</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {!isAdminLoggedIn && isUserLoggedIn ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="User profile"
                className={`font-jakarta flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  isDarkTheme
                    ? "bg-[#B0B0B0] text-[#121212]"
                    : isSepiaTheme
                      ? "bg-black text-[#f8f1e3]"
                      : isGrayTheme
                        ? "border border-[#C9CACA] bg-[#5a5a5c] text-[#C9CACA]"
                        : "bg-slate-900 text-white"
                }`}
              >
                {(userName.trim().charAt(0) || "U").toUpperCase()}
              </button>

              {menuOpen ? (
                <div
                  className={`absolute right-0 top-11 min-w-40 rounded-xl border p-1.5 shadow-lg ${dropdownClass}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className={`font-jakarta flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium transition ${dropdownItemClass}`}
                  >
                    Profile
                  </button>
                  <Link
                    to="/saved"
                    onClick={() => setMenuOpen(false)}
                    className={`font-jakarta flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium transition ${dropdownItemClass}`}
                  >
                    Saved articles
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className={`font-jakarta flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${dropdownItemClass}`}
                  >
                    {logoutLoading ? <Spinner className="h-4 w-4" /> : null}
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div ref={mobileMenuRef} className="relative md:hidden">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${actionClass}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="m18 6-12 12M6 6l12 12" />
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>

          {mobileMenuOpen ? (
            <div className={`absolute right-0 top-12 z-40 w-[min(9rem,calc(100vw-2rem))] rounded-2xl border p-3 shadow-lg ${dropdownClass}`}>
              <div className="flex flex-col gap-2">
                {isAdminLoggedIn ? (
                  <div className="mb-1 flex items-center gap-3 rounded-xl border border-transparent px-1 py-1">
                    <span
                      className={`font-jakarta flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        isDarkTheme
                          ? "bg-[#B0B0B0] text-[#121212]"
                          : isSepiaTheme
                            ? "bg-black text-[#f8f1e3]"
                            : isGrayTheme
                              ? "border border-[#C9CACA] bg-[#5a5a5c] text-[#C9CACA]"
                              : "bg-slate-900 text-white"
                      }`}
                    >
                      {adminInitial}
                    </span>
                    <span className={`font-jakarta text-sm ${textClass}`}>Admin</span>
                  </div>
                ) : null}

                {isUserLoggedIn && !isAdminLoggedIn ? (
                  <div className="mb-1 flex items-center gap-3 rounded-xl border border-transparent px-1 py-1">
                    <span
                      className={`font-jakarta flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        isDarkTheme
                          ? "bg-[#B0B0B0] text-[#121212]"
                          : isSepiaTheme
                            ? "bg-black text-[#f8f1e3]"
                            : isGrayTheme
                              ? "border border-[#C9CACA] bg-[#5a5a5c] text-[#C9CACA]"
                              : "bg-slate-900 text-white"
                      }`}
                    >
                      {userInitial}
                    </span>
                    <span className={`font-jakarta text-sm ${textClass}`}>{userName || "User"}</span>
                  </div>
                ) : null}

                {isHomePage ? (
                  <Link
                    to="/read"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-jakarta inline-flex w-full items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition ${actionClass}`}
                  >
                    Start Reading
                  </Link>
                ) : null}

                {!isAdminLoggedIn && !isUserLoggedIn && isPublicReadingPage ? (
                  <Link
                    to="/login"
                    state={{ from: currentPath }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-jakarta inline-flex w-full items-center justify-center rounded-xl border border-black bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#222]"
                  >
                    Login
                  </Link>
                ) : null}

                {isAdminLoggedIn && !isWritePage && !isAdminBlogsPage ? (
                  <Link
                    to="/admin/blogs"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-jakarta inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition ${actionClass}`}
                  >
                    Manage
                  </Link>
                ) : null}

                {isAdminLoggedIn ? (
                  isWritePage ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await onPublish();
                        setMobileMenuOpen(false);
                      }}
                      disabled={!canPublish || publishLoading}
                      className={`font-jakarta inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${actionClass}`}
                    >
                      {publishLoading ? <Spinner className="h-4 w-4" /> : null}
                      <span>Publish</span>
                    </button>
                  ) : (
                    <Link
                      to="/write"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`font-jakarta inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${actionClass}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="m16.5 3.5 4 4L8 20l-5 1 1-5Z" />
                      </svg>
                      Write
                    </Link>
                  )
                ) : null}

                {isUserLoggedIn && !isAdminLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`font-jakarta flex items-center justify-start rounded-xl px-3 py-2 text-sm font-medium transition ${dropdownItemClass}`}
                  >
                    Profile
                  </button>
                ) : null}

                {isUserLoggedIn && !isAdminLoggedIn ? (
                  <Link
                    to="/saved"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-jakarta flex items-center justify-start rounded-xl px-3 py-2 text-sm font-medium transition ${dropdownItemClass}`}
                  >
                    Saved articles
                  </Link>
                ) : null}

                {isWritePage && draftSaveState !== "idle" ? (
                  <div className={`font-jakarta inline-flex items-center gap-2 px-3 py-1 text-xs ${isDarkTheme ? "text-[#B0B0B0]" : isGrayTheme ? "text-[#C9CACA]" : "text-[#707070]"}`}>
                    {draftSaveState === "saving" ? <Spinner className="h-3 w-3" /> : null}
                    <span>{draftSaveState === "saving" ? "Saving" : "Saved"}</span>
                  </div>
                ) : null}

                {isThemePage ? (
                  <div className="mt-1 rounded-xl border border-slate-200/70 p-3">
                    <p className={`font-jakarta mb-3 text-xs font-semibold uppercase tracking-[0.16em] ${isDarkTheme ? "text-[#B0B0B0]" : isGrayTheme ? "text-[#C9CACA]" : "text-[#707070]"}`}>
                      Theme
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Light theme"
                        onClick={() => onThemeChange("light")}
                        className={`${themeButtonBaseClass} border-slate-300 bg-[#FBFBFB] ${themeMode === "light" ? "ring-2 ring-emerald-500" : ""}`}
                      />
                      <button
                        type="button"
                        aria-label="Sepia theme"
                        onClick={() => onThemeChange("sepia")}
                        className={`${themeButtonBaseClass} border-[#e7dcc7] bg-[#f8f1e3] ${themeMode === "sepia" ? "ring-2 ring-emerald-500" : ""}`}
                      />
                      <button
                        type="button"
                        aria-label="Gray theme"
                        onClick={() => onThemeChange("gray")}
                        className={`${themeButtonBaseClass} border-[#7a7a7d] bg-[#5a5a5c] ${themeMode === "gray" ? "ring-2 ring-emerald-500" : ""}`}
                      />
                      <button
                        type="button"
                        aria-label="Dark theme"
                        onClick={() => onThemeChange("dark")}
                        className={`${themeButtonBaseClass} border-slate-500 bg-[#121212] ${themeMode === "dark" ? "ring-2 ring-emerald-500" : ""}`}
                      />
                    </div>
                  </div>
                ) : null}

                {(isAdminLoggedIn || isUserLoggedIn) ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className={`font-jakarta flex items-center justify-start gap-2 rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${dropdownItemClass}`}
                  >
                    {logoutLoading ? <Spinner className="h-4 w-4" /> : null}
                    <span>Logout</span>
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
