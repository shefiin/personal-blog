export const getUserCookieOptions = (isProd) => {
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
          path: "/api/auth/refresh", 
        }
      };
};


export const clearUserCookies = (res) => {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
};
