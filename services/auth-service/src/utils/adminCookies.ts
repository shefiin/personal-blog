const isProd = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
};

// ✅ FIX: Only clears the old path-scoped cookie if it ever existed.
//    Called once during setAuthCookies to prevent duplicate-name collisions.
const clearLegacyRefreshCookie = (res) => {
  res.clearCookie("uf_admin_rt", {
    ...baseCookieOptions,
    path: "/api/admin/auth",
  });
};

export const setAuthCookies = (res, accessToken: string, refreshToken: string) => {
  clearLegacyRefreshCookie(res);

  res.cookie("uf_admin_at", accessToken, {
    ...baseCookieOptions,
    path:   "/",
    maxAge: 15 * 60 * 1000,           // 15 minutes
  });

  res.cookie("uf_admin_rt", refreshToken, {
    ...baseCookieOptions,
    path:   "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie("uf_admin_at", { ...baseCookieOptions, path: "/" });
  res.clearCookie("uf_admin_rt", { ...baseCookieOptions, path: "/" });
  clearLegacyRefreshCookie(res);
};