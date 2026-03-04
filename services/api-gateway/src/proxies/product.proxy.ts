import { createProxyMiddleware } from "http-proxy-middleware";

export const productProxy = createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL,
    changeOrigin: true,

    onError(err, req, res: any) {
        console.error("store proxy Error:", err);
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Gateway Error(PRODUCT)" }));
    }
});
