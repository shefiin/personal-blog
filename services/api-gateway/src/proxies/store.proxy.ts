import { createProxyMiddleware } from "http-proxy-middleware";

export const storeProxy = createProxyMiddleware({
    target: process.env.STORE_SERVICE_URL,
    changeOrigin: true,

    parseReqBody: false,

    onError(err, req, res) {
        console.error("store proxy Error:", err);
        return res.status(500).json({ message: "Gateway Error(store)" });
    }
});
