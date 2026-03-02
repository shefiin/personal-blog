import { createProxyMiddleware } from "http-proxy-middleware";

export const blogProxy = createProxyMiddleware({
  target: process.env.BLOG_SERVICE_URL,
  changeOrigin: true,

  parseReqBody: false,

  onError(err, req, res) {
    console.error("blog proxy Error:", err);
    return res.status(500).json({ message: "Gateway Error(blog)" });
  }
});
