import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/login";
import Home from "../pages/Home";
import RegisterPage from "../pages/register";
import VerifyOtpPage from "../pages/verify-otp";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
    </Routes>
  );
}


export default AppRouter;
