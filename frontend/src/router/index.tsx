import { Navigate, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/login";
import RegisterPage from "../pages/register";
import Home from "../pages/Home";
import WritePage from "../pages/write";
import PostPage from "../pages/post";
import ReadPage from "../pages/read";
import AdminBlogsPage from "../pages/adminBlogs";
import SavedArticlesPage from "../pages/saved";

type ThemeMode = "light" | "dark" | "sepia" | "gray";
type DraftSaveState = "idle" | "saving" | "saved";

type AppRouterProps = {
  isAdminLoggedIn: boolean;
  isUserLoggedIn: boolean;
  userId: string;
  userName: string;
  authChecked: boolean;
  onLoginSuccess: () => void;
  onUserLoginSuccess: () => void;
  themeMode: ThemeMode;
  onRegisterPublish: ((handler: (() => Promise<void>) | null) => void);
  onPublishAvailabilityChange: (enabled: boolean) => void;
  onDraftSaveStateChange: (state: DraftSaveState) => void;
};

function AppRouter({
  isAdminLoggedIn,
  isUserLoggedIn,
  userId,
  userName,
  authChecked,
  onLoginSuccess,
  onUserLoginSuccess,
  themeMode,
  onRegisterPublish,
  onPublishAvailabilityChange,
  onDraftSaveStateChange
}: AppRouterProps) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/read" element={<ReadPage />} />
      <Route path="/saved" element={isUserLoggedIn ? <SavedArticlesPage /> : <Navigate to="/login" replace />} />
      <Route path="/blog/:slug" element={<PostPage themeMode={themeMode} isUserLoggedIn={isUserLoggedIn} userId={userId} userName={userName} />} />
      <Route
        path="/admin/blogs"
        element={
          !authChecked ? (
            <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-stone-50 via-white to-slate-50 px-4 py-12" />
          ) : isAdminLoggedIn ? (
            <AdminBlogsPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/write"
        element={
          !authChecked ? (
            <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-stone-50 via-white to-slate-50 px-4 py-12" />
          ) : isAdminLoggedIn ? (
            <WritePage
              themeMode={themeMode}
              onRegisterPublish={onRegisterPublish}
              onPublishAvailabilityChange={onPublishAvailabilityChange}
              onDraftSaveStateChange={onDraftSaveStateChange}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          !authChecked ? (
            <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50 to-white px-4 py-12" />
          ) : isAdminLoggedIn || isUserLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onLoginSuccess={onLoginSuccess} onUserLoginSuccess={onUserLoginSuccess} />
          )
        }
      />
      <Route
        path="/register"
        element={isAdminLoggedIn || isUserLoggedIn ? <Navigate to="/" replace /> : <RegisterPage onRegisterSuccess={onUserLoginSuccess} />}
      />
    </Routes>
  );
}


export default AppRouter;
