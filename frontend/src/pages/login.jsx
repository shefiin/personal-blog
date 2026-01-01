import LoginModal from "../Components/login/LoginModal";

const LoginPage = () => {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-6 border rounded">
          <h2 className="text-xl font-semibold mb-4">Login</h2>
          {<LoginModal/>}
        </div>
      </div>
    );
  };
  
export default LoginPage;