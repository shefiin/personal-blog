import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router";
import Navbar from "./Components/Navbar/Navbar";
import { getSession, logoutAuth } from "./api/auth.api";

type ThemeMode = "light" | "sepia" | "gray" | "dark";
type PublishHandler = () => Promise<void>;
type DraftSaveState = "idle" | "saving" | "saved";
type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified?: boolean;
  createdAt?: string;
};

function App(){
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
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
        const response = await getSession();
        setIsAdminLoggedIn(Boolean(response.data.admin));
        setUserProfile(response.data.user || null);
        setIsUserLoggedIn(Boolean(response.data.user));
      } catch {
        setIsAdminLoggedIn(false);
        setIsUserLoggedIn(false);
        setUserProfile(null);
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

  const handleUserLoginSuccess = async () => {
    const response = await getSession();
    setUserProfile(response.data.user || null);
    setIsUserLoggedIn(Boolean(response.data.user));
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logoutAuth();
    } finally {
      setIsAdminLoggedIn(false);
      setIsUserLoggedIn(false);
      setUserProfile(null);
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
          isUserLoggedIn={isUserLoggedIn}
          userName={userProfile?.name || ""}
          userEmail={userProfile?.email || ""}
          userJoinedAt={userProfile?.createdAt || ""}
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
            isUserLoggedIn={isUserLoggedIn}
            userId={userProfile?.id || ""}
            userName={userProfile?.name || ""}
            authChecked={authChecked}
            onLoginSuccess={handleLoginSuccess}
            onUserLoginSuccess={handleUserLoginSuccess}
            themeMode={themeMode}
            onRegisterPublish={handleRegisterPublish}
            onPublishAvailabilityChange={handlePublishAvailabilityChange}
            onDraftSaveStateChange={setDraftSaveState}
          />
        </div>

      </div>
    </BrowserRouter>
  )
}

export default App
























