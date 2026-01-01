import { useState } from "react";
import LoginModal from "../login/LoginModal";
import SignupModal from "../Signup/SignupModal";

const Navbar = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
  
    return (
      <>
        <nav className="w-full h-16 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <span className="text-xl font-semibold">UrbanFresh</span>
  
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogin(true)}
                className="text-gray-700 hover:text-gray-900"
              >
                Login
              </button>
  
              <button 
                onClick={() => setShowSignup(true)}
                className="px-4 py-2 bg-gray-900 text-white rounded">
                Register
              </button>
            </div>
          </div>
        </nav>
  
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
      </>
    );
  };
  
  export default Navbar;
  


