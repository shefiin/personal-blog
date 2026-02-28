import { createProxyMiddleware } from "http-proxy-middleware";

export const productProxy = createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL,
    changeOrigin: true,

    parseReqBody: false,

    onError(err, req, res) {
        console.error("store proxy Error:", err);
        return res.status(500).json({ message: "Gateway Error(PRODUCT)" });
    }
});
