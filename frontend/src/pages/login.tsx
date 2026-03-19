import AuthForm from "../Components/auth/AuthForm";

type LoginPageProps = {
  onLoginSuccess: () => void;
  onUserLoginSuccess?: () => void;
};

const LoginPage = ({ onLoginSuccess, onUserLoginSuccess }: LoginPageProps) => {
  return <AuthForm mode="login" onLoginSuccess={onLoginSuccess} onUserLoginSuccess={onUserLoginSuccess} />;
};

export default LoginPage;
