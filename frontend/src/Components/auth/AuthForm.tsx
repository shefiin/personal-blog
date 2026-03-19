import { AxiosError } from "axios";
import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getGoogleAuthUrl, loginUser, registerUser, resendUserOtp, verifyUserOtp } from "../../api/auth.api";
import Spinner from "../common/Spinner";

type ApiError = {
  message?: string;
  resendAvailableInSeconds?: number;
};

type AuthFormProps = {
  mode: "login" | "register";
  onLoginSuccess?: () => void;
  onRegisterSuccess?: () => void;
  onUserLoginSuccess?: () => void;
  onModeChange?: (mode: "login" | "register") => void;
  variant?: "page" | "embedded";
  hideHeader?: boolean;
  hideSwitchLinks?: boolean;
  hideGoogleButton?: boolean;
  redirectTo?: string;
  stayOnSuccess?: boolean;
};

const AuthForm = ({
  mode,
  onLoginSuccess,
  onRegisterSuccess,
  onUserLoginSuccess,
  onModeChange,
  variant = "page",
  hideHeader = false,
  hideSwitchLinks = false,
  hideGoogleButton = false,
  redirectTo: redirectOverride,
  stayOnSuccess = false
}: AuthFormProps) => {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "verify">(isRegister ? "form" : "form");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const redirectTo = redirectOverride || (location.state as { from?: string } | null)?.from || "/read";
  const canSubmitForm = isRegister
    ? Boolean(name.trim() && email.trim() && password.trim())
    : Boolean(email.trim() && password.trim());

  const renderModeSwitch = (nextMode: "login" | "register", label: string) => {
    if (onModeChange) {
      return (
        <button
          type="button"
          onClick={() => onModeChange(nextMode)}
          className="font-bold text-black underline underline-offset-4"
        >
          {label}
        </button>
      );
    }

    return (
      <Link to={nextMode === "login" ? "/login" : "/register"} state={{ from: redirectTo }} className="font-bold text-black underline underline-offset-4">
        {label}
      </Link>
    );
  };

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isRegister) {
      setLoading(true);
      try {
        const response = await registerUser({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password
        });
        setStep("verify");
        setResendCountdown(response.data.resendAvailableInSeconds);
      } catch (err) {
        const axiosErr = err as AxiosError<ApiError>;
        setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({
        email: email.trim(),
        password
      });

      if (response.data.role === "user") {
        onUserLoginSuccess?.();
      } else {
        onLoginSuccess?.();
      }

      if (!stayOnSuccess) {
        navigate(redirectTo);
      }
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setOtpLoading(true);

    try {
      await verifyUserOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });
      onRegisterSuccess?.();
      setSuccess("Email verified. Your account is ready.");
      if (!stayOnSuccess) {
        window.setTimeout(() => navigate(redirectTo), 700);
      }
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      const response = await resendUserOtp({ email: email.trim().toLowerCase() });
      setResendCountdown(response.data.resendAvailableInSeconds);
      setSuccess("A new verification code has been sent.");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.message || "Failed to resend OTP.");
      if (axiosErr.response?.data?.resendAvailableInSeconds) {
        setResendCountdown(axiosErr.response.data.resendAvailableInSeconds);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleEditRegistrationDetails = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Delay the step swap to avoid the click landing on the newly rendered submit button.
    window.setTimeout(() => {
      setStep("form");
      setOtp("");
      setError("");
      setSuccess("");
    }, 0);
  };

  const handleGoogleAuth = () => {
    window.location.href = getGoogleAuthUrl(redirectTo);
  };

  const content = (
    <>
      {!hideHeader ? (
        <div className="px-4 pt-8 text-center">
          <h1 className="text-xl font-bold tracking-tight text-[#171717] md:text-[26px]">
            {isRegister ? (step === "verify" ? "Verify email" : "Create your account") : "Login"}
          </h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            {isRegister
              ? step === "verify"
                ? `Enter the 6-digit code sent to ${email}.`
                : "Create a reader account"
              : "Enter your credentials to continue."}
          </p>
        </div>
      ) : null}

      {isRegister && step === "verify" ? (
        <form onSubmit={handleVerifyOtp} className={`flex flex-col gap-5 px-2 ${hideHeader ? "pb-2 pt-4" : "pb-10 pt-10"}`}>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="6-digit code"
              className="mx-auto h-[38px] w-full max-w-[280px] rounded-lg border border-slate-200 px-4 text-sm outline-none transition focus:border-black"
            />

            {error ? <p className="mx-auto flex min-h-[38px] w-full max-w-[280px] items-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm text-red-600">{error}</p> : null}
            {success ? <p className="mx-auto flex min-h-[38px] w-full max-w-[280px] items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-700">{success}</p> : null}

            <button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className="mx-auto flex h-[38px] w-full max-w-[280px] items-center justify-center gap-2 rounded-lg bg-black text-sm font-bold text-white transition hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:bg-[#c9caca] disabled:text-white"
            >
              {otpLoading ? <Spinner className="h-4 w-4" /> : null}
              <span>Verify OTP</span>
            </button>

            <div className="mx-auto flex w-full max-w-[280px] items-center justify-between px-3 py-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || resendCountdown > 0}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717] transition hover:text-black disabled:cursor-not-allowed disabled:text-[#9c9c9c]"
              >
                {resendLoading ? <Spinner className="h-4 w-4" /> : null}
                <span>Resend OTP</span>
              </button>
              <span className="text-sm font-medium text-[#6B6B6B]">
                {resendCountdown > 0 ? `${resendCountdown}s` : "Ready"}
              </span>
            </div>

            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleEditRegistrationDetails}
              className="text-center text-sm text-[#6B6B6B] underline underline-offset-4"
            >
              Edit registration details
            </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-5 px-2 ${hideHeader ? "pb-2 pt-4" : "pb-10 pt-10"}`}>
          {isRegister ? (
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Full name"
              className="mx-auto h-[38px] w-full max-w-[280px] rounded-lg border border-slate-200 px-4 text-sm outline-none transition focus:border-black"
            />
          ) : null}

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="Email"
            className="mx-auto h-[38px] w-full max-w-[280px] rounded-lg border border-slate-200 px-4 text-sm outline-none transition focus:border-black"
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={isRegister ? 8 : undefined}
            placeholder={isRegister ? "Create password" : "Password"}
            className="mx-auto h-[38px] w-full max-w-[280px] rounded-lg border border-slate-200 px-4 text-sm outline-none transition focus:border-black"
          />

          {error ? <p className="mx-auto flex min-h-[38px] w-full max-w-[280px] items-center rounded-lg border border-red-200 bg-red-50 px-3 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mx-auto flex min-h-[38px] w-full max-w-[280px] items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={loading || !canSubmitForm}
            className="mx-auto flex h-[38px] w-full max-w-[280px] items-center justify-center gap-2 rounded-lg bg-black text-sm font-bold text-white transition hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:bg-[#c9caca] disabled:text-white"
          >
            {loading ? <Spinner className="h-4 w-4" /> : null}
            <span>{isRegister ? "Create account" : "Login"}</span>
          </button>

          {!hideGoogleButton ? (
            <>
              <div className="mx-auto flex w-full max-w-[280px] items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#6B6B6B]">Or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="mx-auto flex h-[38px] w-full max-w-[280px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#171717] transition hover:bg-slate-50"
              >
                <img src="/images/google.svg" alt="Google" className="h-4 w-4" />
                <span>Continue with Google</span>
              </button>
            </>
          ) : null}

          {!hideSwitchLinks ? (
            <div className="mt-2 text-center text-sm text-[#6B6B6B]">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  {renderModeSwitch("login", "Login")}
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  {renderModeSwitch("register", "Create one")}
                </>
              )}
            </div>
          ) : null}
        </form>
      )}
    </>
  );

  if (variant === "embedded") {
    return <div className="font-jakarta">{content}</div>;
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <section className="font-jakarta mx-auto w-full max-w-[340px] rounded-2xl border border-[#ece4d8] bg-white shadow-[0_24px_70px_rgba(52,33,13,0.08)]">
        {content}
      </section>
    </main>
  );
};

export default AuthForm;
