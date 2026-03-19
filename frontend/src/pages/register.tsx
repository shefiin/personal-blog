import AuthForm from "../Components/auth/AuthForm";

type RegisterPageProps = {
  onRegisterSuccess: () => void;
};

const RegisterPage = ({ onRegisterSuccess }: RegisterPageProps) => {
  return <AuthForm mode="register" onRegisterSuccess={onRegisterSuccess} />;
};

export default RegisterPage;
