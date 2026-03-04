import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Link } from "react-router-dom";
import AppRouter from "./router";
import Navbar from "./Components/Navbar/Navbar";
import { getAdminSession, logoutAdmin } from "./api/auth.api";

type ThemeMode = "light" | "sepia" | "gray" | "dark";
type PublishHandler = () => Promise<void>;
type DraftSaveState = "idle" | "saving" | "saved";

function App(){
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("code-context-theme");
    if (stored === "light" || stored === "dark" || stored === "sepia" || stored === "gray") return stored;
    if (stored === "white") return "light";
    if (stored === "beige") return "sepia";
    return "light";
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getAdminSession();
        setIsAdminLoggedIn(response.data.loggedIn);
      } catch {
        setIsAdminLoggedIn(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    localStorage.setItem("code-context-theme", themeMode);
  }, [themeMode]);

  const publishHandlerRef = useRef<PublishHandler | null>(null);

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logoutAdmin();
    } finally {
      setIsAdminLoggedIn(false);
      setLogoutLoading(false);
    }
  };

  const handleRegisterPublish = useCallback((handler: PublishHandler | null) => {
    publishHandlerRef.current = handler;
  }, []);

  const handlePublishAvailabilityChange = useCallback((enabled: boolean) => {
    setCanPublish(enabled);
  }, []);

  const handlePublish = useCallback(async () => {
    if (!publishHandlerRef.current || !canPublish || publishLoading) return;
    setPublishLoading(true);
    try {
      await publishHandlerRef.current();
    } finally {
      setPublishLoading(false);
    }
  }, [canPublish, publishLoading]);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar
          isAdminLoggedIn={isAdminLoggedIn}
          onLogout={handleLogout}
          logoutLoading={logoutLoading}
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          canPublish={canPublish}
          publishLoading={publishLoading}
          onPublish={handlePublish}
          draftSaveState={draftSaveState}
        />
        <div className="flex-1 pt-16">
          <AppRouter
            isAdminLoggedIn={isAdminLoggedIn}
            authChecked={authChecked}
            onLoginSuccess={handleLoginSuccess}
            themeMode={themeMode}
            onRegisterPublish={handleRegisterPublish}
            onPublishAvailabilityChange={handlePublishAvailabilityChange}
            onDraftSaveStateChange={setDraftSaveState}
          />
        </div>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-600">
          <span>Code & Context all rights reserved</span>
          {authChecked && !isAdminLoggedIn ? (
            <>
              <span> - </span>
              <Link to="/login" className="font-medium text-slate-800 hover:text-slate-600">
                Admin
              </Link>
            </>
          ) : null}
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App































