# JWT Gateway Demo (Node.js)

Four services:
- auth-service (5000): issues JWTs
- orders-service (5001): protected resource (orders)
- products-service (5002): protected resource (products)
- api-gateway (4000): validates JWT and routes requests

Quick start:
1. In each service folder run `npm install`
2. Start each service: `npm start` (start auth, orders, products, then gateway)
3. Login: POST /auth/login with {"email":"user@example.com","password":"user123"} to get token
4. Call protected endpoints through gateway: GET /api/products, GET /api/orders

Default users:
- admin@example.com / admin123 (roles: admin, scopes: orders:read,orders:write,products:read,products:write)
- user@example.com / user123 (roles: user, scopes: orders:read,products:read)
