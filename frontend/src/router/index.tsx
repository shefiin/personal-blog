import { Navigate, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/login";
import Home from "../pages/Home";
import WritePage from "../pages/write";
import PostPage from "../pages/post";
import ReadPage from "../pages/read";
import AdminBlogsPage from "../pages/adminBlogs";

type ThemeMode = "light" | "dark" | "sepia" | "gray";
type DraftSaveState = "idle" | "saving" | "saved";

type AppRouterProps = {
  isAdminLoggedIn: boolean;
  authChecked: boolean;
  onLoginSuccess: () => void;
  themeMode: ThemeMode;
  onRegisterPublish: ((handler: (() => Promise<void>) | null) => void);
  onPublishAvailabilityChange: (enabled: boolean) => void;
  onDraftSaveStateChange: (state: DraftSaveState) => void;
};

function AppRouter({
  isAdminLoggedIn,
  authChecked,
  onLoginSuccess,
  themeMode,
  onRegisterPublish,
  onPublishAvailabilityChange,
  onDraftSaveStateChange
}: AppRouterProps) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/read" element={<ReadPage />} />
      <Route path="/blog/:slug" element={<PostPage themeMode={themeMode} />} />
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
          ) : isAdminLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onLoginSuccess={onLoginSuccess} />
          )
        }
      />
    </Routes>
  );
}


export default AppRouter;
