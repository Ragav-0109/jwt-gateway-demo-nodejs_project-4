import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { verifyJWT, requireScopes, requireRole } from "../common/middleware/auth.js";

const app = express();
app.use(express.json());

const { PORT = 5001 } = process.env;

const ORDERS = [
  { id: 1, userId: "u2", item: "Keyboard", qty: 1 },
  { id: 2, userId: "u1", item: "Monitor", qty: 2 }
];

app.get("/", verifyJWT(), requireScopes("orders:read"), (req, res) => {
  const isAdmin = req.user.roles?.includes("admin");
  const data = isAdmin ? ORDERS : ORDERS.filter(o => o.userId === req.user.id);
  res.json({ orders: data });
});

app.post("/", verifyJWT(), requireScopes("orders:write"), (req, res) => {
  const { item, qty } = req.body || {};
  const id = ORDERS.length + 1;
  ORDERS.push({ id, userId: req.user.id, item, qty });
  res.status(201).json({ id, item, qty, userId: req.user.id });
});

app.delete("/:id", verifyJWT(), requireRole("admin"), requireScopes("orders:write"), (req, res) => {
  const id = Number(req.params.id);
  const idx = ORDERS.findIndex(o => o.id === id);
  if (idx < 0) return res.status(404).json({ error: "Not found" });
  const [removed] = ORDERS.splice(idx, 1);
  res.json({ removed });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`orders-service on :${PORT}`));
