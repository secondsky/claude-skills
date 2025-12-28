# better-auth with API Frameworks

Complete guide for integrating better-auth with Express, Fastify, NestJS, and Hono.

---

## Express

### Installation

```bash
bun add better-auth express drizzle-orm postgres
bun add -D @types/express
```

### Setup

**`src/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
});
```

**`src/index.ts`**:
```typescript
import express from "express";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";

const app = express();

// Auth routes
app.all("/api/auth/*", toNodeHandler(auth));

// Protected route example
app.get("/api/protected", async (req, res) => {
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ user: session.user });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Middleware

```typescript
import type { Request, Response, NextFunction } from "express";
import { auth } from "./auth";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.session = session;
  next();
}

// Usage
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});
```

---

## Fastify

### Installation

```bash
bun add better-auth fastify drizzle-orm postgres
```

### Setup

**`src/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
});
```

**`src/index.ts`**:
```typescript
import Fastify from "fastify";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";

const fastify = Fastify({ logger: true });

// Auth routes
fastify.all("/api/auth/*", async (request, reply) => {
  const handler = toNodeHandler(auth);
  // Convert Fastify request/reply to Node req/res
  await handler(request.raw, reply.raw);
});

// Protected route
fastify.get("/api/protected", async (request, reply) => {
  const session = await auth.api.getSession({
    headers: request.headers as any,
  });

  if (!session) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  return { user: session.user };
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log("Server running on http://localhost:3000");
});
```

### Fastify Plugin

```typescript
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { auth } from "./auth";

declare module "fastify" {
  interface FastifyRequest {
    session: typeof auth.$Infer.Session | null;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest("session", null);

  fastify.addHook("preHandler", async (request) => {
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });
    request.session = session;
  });
};

export default fp(authPlugin);
```

---

## NestJS

### Installation

```bash
bun add better-auth @nestjs/common @nestjs/core drizzle-orm postgres
```

### Auth Module

**`src/auth/auth.module.ts`**:
```typescript
import { Module, Global } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Global()
@Module({
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

**`src/auth/auth.service.ts`**:
```typescript
import { Injectable } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

@Injectable()
export class AuthService {
  public readonly auth: ReturnType<typeof betterAuth>;

  constructor() {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client, { schema });

    this.auth = betterAuth({
      database: drizzleAdapter(db, { provider: "pg" }),
      secret: process.env.BETTER_AUTH_SECRET!,
      baseURL: process.env.APP_URL,
      emailAndPassword: { enabled: true },
    });
  }

  async getSession(headers: Headers) {
    return this.auth.api.getSession({ headers });
  }
}
```

**`src/auth/auth.controller.ts`**:
```typescript
import { All, Controller, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { toNodeHandler } from "better-auth/node";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All("*")
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(this.authService.auth);
    return handler(req, res);
  }
}
```

### Auth Guard

**`src/auth/auth.guard.ts`**:
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headers = new Headers();

    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      }
    }

    const session = await this.authService.getSession(headers);

    if (!session) {
      throw new UnauthorizedException();
    }

    request.session = session;
    return true;
  }
}
```

### Usage

```typescript
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "./auth/auth.guard";

@Controller("api")
export class AppController {
  @Get("protected")
  @UseGuards(AuthGuard)
  getProtected(@Req() req: any) {
    return { user: req.session.user };
  }
}
```

---

## Hono (Non-Cloudflare)

### Installation

```bash
bun add better-auth hono drizzle-orm postgres
```

### Setup

**`src/index.ts`**:
```typescript
import { Hono } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_URL,
  emailAndPassword: { enabled: true },
});

const app = new Hono();

// Auth routes
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

// Protected route
app.get("/api/protected", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user: session.user });
});

export default app;
```

### Middleware

```typescript
import { createMiddleware } from "hono/factory";
import { auth } from "./auth";

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("session", session);
  await next();
});

// Usage
app.use("/api/protected/*", authMiddleware);

app.get("/api/protected/data", (c) => {
  const session = c.get("session");
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ user: session.user });
});
```

---

## CORS Configuration

All frameworks need CORS for frontend integration:

```typescript
// Express
import cors from "cors";
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// Fastify
fastify.register(require("@fastify/cors"), {
  origin: "http://localhost:3000",
  credentials: true,
});

// Hono
import { cors } from "hono/cors";
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
```

---

## Official Resources

- Node.js Handler: https://better-auth.com/docs/integrations/node
- Express: https://better-auth.com/docs/integrations/express
- Fastify: https://better-auth.com/docs/integrations/fastify
- Hono: https://better-auth.com/docs/integrations/hono
