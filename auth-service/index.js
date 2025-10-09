import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const {
  PORT = 5000,
  JWT_SECRET = "dev",
  JWT_ISSUER = "demo.issuer",
  JWT_AUDIENCE = "demo.audience"
} = process.env;

const USERS = {
  "admin@example.com": { id: "u1", password: "admin123", roles: ["admin"], scopes: ["orders:read","orders:write","products:read","products:write"] },
  "user@example.com":  { id: "u2", password: "user123",  roles: ["user"],  scopes: ["orders:read","products:read"] }
};

function signToken({ sub, email, roles, scopes }) {
  return jwt.sign(
    { sub, email, roles, scopes },
    JWT_SECRET,
    { algorithm: "HS256", issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: "1h" }
  );
}

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = USERS[email];
  if (!u || u.password !== password) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken({ sub: u.id, email, roles: u.roles, scopes: u.scopes });
  res.json({ access_token: token, token_type: "Bearer", expires_in: 3600, user: { id: u.id, email, roles: u.roles } });
});

app.get("/.well-known/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`auth-service on :${PORT}`));
