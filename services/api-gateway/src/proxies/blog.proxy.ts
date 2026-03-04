import { createProxyMiddleware } from "http-proxy-middleware";

export const blogProxy = createProxyMiddleware({
  target: process.env.BLOG_SERVICE_URL,
  changeOrigin: true,

  onError(err, req, res: any) {
    console.error("blog proxy Error:", err);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Gateway Error(blog)" }));
  }
});
