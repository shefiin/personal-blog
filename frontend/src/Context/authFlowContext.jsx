import { createContext, useContext, useState } from "react";

const AuthFlowContext = createContext(null);

export const AuthFlowProvider = ({ children }) => {
    const [verifyToken, setVerifyToken] = useState(null);
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