const jwt = require("jsonwebtoken");

const { JWT_SECRET = "dev", JWT_ISSUER = "demo.issuer", JWT_AUDIENCE = "demo.audience" } = process.env;

function verifyJWT(optional = false) {
  return (req, res, next) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      if (optional) return next();
      return res.status(401).json({ error: "Missing token" });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
      req.user = {
        id: payload.sub,
        roles: payload.roles || [],
        scopes: payload.scopes || [],
        email: payload.email,
      };
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid token", details: e.message });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.roles?.some(r => roles.includes(r))) {
      return res.status(403).json({ error: "Insufficient role", needAnyOf: roles });
    }
    next();
  };
}

function requireScopes(...needed) {
  return (req, res, next) => {
    const have = new Set(req.user?.scopes || []);
    const ok = needed.every(s => have.has(s));
    if (!ok) return res.status(403).json({ error: "Missing scopes", needAll: needed });
    next();
  };
}

module.exports = { verifyJWT, requireRole, requireScopes };
