import { createContext, useContext, useState, type ReactNode } from "react";

type AuthFlowContextValue = {
  verifyToken: string | null;
  setVerifyToken: (value: string | null) => void;
  otpOpen: boolean;
  setOtpOpen: (value: boolean) => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export const AuthFlowProvider = ({ children }: { children: ReactNode }) => {
  const [verifyToken, setVerifyToken] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);

  return (
    <AuthFlowContext.Provider
      value={{
        verifyToken,
        setVerifyToken,
        otpOpen,
        setOtpOpen
      }}
    >
      {children}
    </AuthFlowContext.Provider>
  );
};

export const useAuthFlow = () => useContext(AuthFlowContext);
