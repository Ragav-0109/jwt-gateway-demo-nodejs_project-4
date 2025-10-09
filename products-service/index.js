import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { verifyJWT, requireScopes, requireRole } from "../common/middleware/auth.js";

const app = express();
app.use(express.json());

const { PORT = 5002 } = process.env;

let PRODUCTS = [
  { id: 1, name: "Keyboard", price: 1999 },
  { id: 2, name: "Monitor", price: 12999 }
];

app.get("/", verifyJWT(), requireScopes("products:read"), (req, res) => {
  res.json({ products: PRODUCTS });
});

app.post("/", verifyJWT(), requireRole("admin"), requireScopes("products:write"), (req, res) => {
  const { name, price } = req.body || {};
  const id = PRODUCTS.length + 1;
  const p = { id, name, price };
  PRODUCTS.push(p);
  res.status(201).json(p);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`products-service on :${PORT}`));
