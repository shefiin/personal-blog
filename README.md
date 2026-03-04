Code & Context blog platform using microservices🚀

## Local Login Setup

1. Copy env templates:
   - `cp services/auth-service/.env.example services/auth-service/.env`
   - `cp services/api-gateway/.env.example services/api-gateway/.env`
   - `cp frontend/.env.example frontend/.env`
2. Start local dependencies:
   - MongoDB on `mongodb://127.0.0.1:27017`
   - Redis on `redis://127.0.0.1:6379`
3. Start services:
   - auth service on `3001`
   - api gateway on `8000`
   - frontend on `5173`

Seed your admin user directly in MongoDB (or via script), then use `/login` from the frontend.
