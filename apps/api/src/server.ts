import { auth } from "@ai-suites/auth";
import cors from "cors";
import express, { type Express } from "express";
import { toNodeHandler } from "better-auth/node";
import pino from "pino";
import { requireAuth, type AuthenticatedRequest } from "./auth-context.js";
import { env } from "./env.js";

const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug"
});

export const app: Express = express();

app.use(
  cors({
    credentials: true,
    origin: env.WEB_ORIGIN
  })
);

app.all("/api/auth/{*any}", toNodeHandler(auth.handler));

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    name: "ai-suites-api",
    ok: true
  });
});

app.get("/api/me", requireAuth, (request, response) => {
  const session = (request as AuthenticatedRequest).authSession;

  response.json({
    user: session.user,
    session: session.session
  });
});

app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, "AI Suites API ready");
});
