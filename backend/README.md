# 🛠️ Backend - Microservices Architecture

This repository contains the **backend services** for the project. The backend is built using a **microservice architecture**, where each service is responsible for a specific domain (e.g., `user-service`).

---

## 🚀 Getting Started

### 1. Setup Environment Variables

- Copy the example environment file:

  ```sh
  cp .env.example .env
  ```

- Fill in the required values (e.g., database URLs, JWT secret, service ports, etc.).

### 2. Run Services with Docker

To start all backend services:

```sh
docker compose up --build
```

This will:

- Build Docker images for each microservice.
- Start all services defined in the `docker-compose.yml` file.
- Run them in isolated containers with networking configured for inter-service communication.

---

## 🏗️ Architecture Overview

The backend follows a **microservices pattern**:

- Each service lives in its own folder (e.g., `user-service`).
- Naming convention: `x-service` (where `x` is the domain, e.g., `user-service`, `order-service`, etc.).
- Each service has its own **Dockerfile**, which builds the application.
- To add a new service, simply:

  1. Create a new folder `x-service`.
  2. Add a `Dockerfile`.
  3. Register the service in `docker-compose.yml`.

---

## 📂 Service Design

Each service follows the principle of **high cohesion and loose coupling**, organized into feature-based modules.

### Example: `/user-service/src/modules/user`

#### 1. **Domain Layer**

Responsible for handling inputs, outputs, and contracts:

- **Controller** → Handles requests & responses.
- **Validator** → Validates and sanitizes input data.
- **Service** → Contains business logic.
- **Repository** → Handles database operations.
- **Interface** → Defines contracts to enforce the Interface Segregation Principle.

> ✅ **Dependency Injection** is used extensively.
> Instead of classes creating their own dependencies, they receive them via constructors.
>
> - Controllers depend on Services.
> - Services depend on Repositories.
> - Repositories implement Interfaces.
>
> This allows unit testing each layer in isolation, mocking dependencies when needed.

#### 2. **Routes**

- Defined in `/entry-point/routes/app.ts`.
- Contains all HTTP methods (GET, POST, PUT, DELETE, etc.).
- Maps routes → controllers.

#### 3. **Exports**

- `app.ts` files serve as entry-points to re-export modules for clean imports.

---

## 🔒 Middleware

- Middleware handles **authentication & authorization**.
- Ensures that the `Authorization` header is valid (JWT validation).
- Provides a layer of security before requests reach controllers.

---

## 📌 Main Entry Point

- Each service has its main entry point at `src/app.ts`.
- This file:

  - Bootstraps the Express server.
  - Loads routes.
  - Applies middleware.

- Implementation can be reused across services with minor modifications.

---

## 📝 TL;DR

- Copy the structure of an existing service when creating a new one.
- Follow naming convention: `x-service`.
- Keep modules cohesive and isolated.
- Use dependency injection everywhere.
- Add service to `docker-compose.yml` to include it in the ecosystem.

---

## 📖 Example Workflow

1. Add a new service `order-service`:

   - Create `/order-service` folder.
   - Add `Dockerfile` in the root directory of the new service
   - Register it in `docker-compose.yml`.
   - Update the api gateway (backend `app.ts`) with the new route refer to
     `const services: Record<string, string> = {
  "user-service": process.env.USER_SERVICE_URL || "http://localhost:6001",
  // add more here, e.g. "order-service": process.env.ORDER_SERVICE_URL
};`
     for an example.

2. Run all services:

   ```sh
   docker compose up --build
   ```

3. Access endpoints:

   - `user-service`: [http://localhost:6001](http://localhost:6001)
   - `order-service`: [http://localhost:6002](http://localhost:6002)
     (depends on ports you set in `.env` and `docker-compose.yml`)
