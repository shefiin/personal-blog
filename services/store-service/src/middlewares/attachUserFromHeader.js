export const attachUserFromHeaders = (req, res, next) => {
    req.user = {
        id: req.headers["x-user-id"],
        email: req.headers["x-user-email"],
        role: req.headers["x-user-role"]
    };
    next();
};