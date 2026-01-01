import { createProxyMiddleware } from "http-proxy-middleware";

export const authProxy = createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,

    parseReqBody: false,

    onError(err, req, res) {
        console.error("auth proxy Error:", err);
        res.status(500).json({ message: "Gateway Error(auth)" });
    }
});