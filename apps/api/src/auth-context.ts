import { auth } from "@ai-suites/auth";
import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export type AuthenticatedRequest = Request & {
  authSession: NonNullable<AuthSession>;
};

export async function getAuthSession(request: Request) {
  return auth.api.getSession({
    headers: fromNodeHeaders(request.headers)
  });
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const session = await getAuthSession(request);

  if (!session) {
    response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required."
      }
    });
    return;
  }

  (request as AuthenticatedRequest).authSession = session;
  next();
}
