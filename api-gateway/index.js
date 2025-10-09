import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import morgan from "morgan";
dotenv.config();

const app = express();
app.use(morgan("dev"));
app.use(express.json());

const {
  PORT = 4000,
  JWT_SECRET = "dev",
  JWT_ISSUER = "demo.issuer",
  JWT_AUDIENCE = "demo.audience",
  ORDERS_URL = "http://localhost:5001",
  PRODUCTS_URL = "http://localhost:5002",
  AUTH_URL = "http://localhost:5000"
} = process.env;

app.use("/auth", createProxyMiddleware({ target: AUTH_URL, changeOrigin: true, pathRewrite: { "^/auth": "" } }));

function gatewayVerifyJWT(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    req.headers["x-user-id"] = payload.sub;
    req.headers["x-user-email"] = payload.email || "";
    req.headers["x-user-roles"] = (payload.roles || []).join(",");
    req.headers["x-user-scopes"] = (payload.scopes || []).join(",");
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token", details: e.message });
  }
}

function requireScopes(...needed) {
  return (req, res, next) => {
    const have = new Set((req.user?.scopes || []));
    const ok = needed.every(s => have.has(s));
    if (!ok) return res.status(403).json({ error: "Missing scopes", needAll: needed });
    next();
  };
}

app.use("/api/orders",
  gatewayVerifyJWT,
  (req, res, next) => {
    const method = req.method.toUpperCase();
    if (["GET"].includes(method)) return requireScopes("orders:read")(req, res, next);
    return requireScopes("orders:write")(req, res, next);
  },
  createProxyMiddleware({ target: ORDERS_URL, changeOrigin: true, pathRewrite: { "^/api/orders": "" } })
);

app.use("/api/products",
  gatewayVerifyJWT,
  (req, res, next) => {
    const method = req.method.toUpperCase();
    if (["GET"].includes(method)) return requireScopes("products:read")(req, res, next);
    return requireScopes("products:write")(req, res, next);
  },
  createProxyMiddleware({ target: PRODUCTS_URL, changeOrigin: true, pathRewrite: { "^/api/products": "" } })
);

app.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.listen(PORT, () => console.log(`api-gateway on :${PORT}`));
