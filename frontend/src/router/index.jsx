import { Routes, Route } from "react-router-dom";
import LoginPage from "../pages/login";
import Home from "../pages/Home";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}


export default AppRouter