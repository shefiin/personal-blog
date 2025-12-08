export const getAdminCookieOptions = (isProd) => {
    return {
      accessOption: {
        httpOnly: true,
        secure: isProd,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, 
        path: "/",              
      },
  
      refreshOption: {
        httpOnly: true,
        secure: isProd,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        path: "/api/admin/auth/refresh", 
      }
    };
};


export const clearAdminCookies = (res) => {
    res.clearCookie("uf_admin_at", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  
    res.clearCookie("uf_admin_rt", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
};
