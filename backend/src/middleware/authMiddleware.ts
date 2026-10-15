import type { MiddlewareHandler } from "hono";
import { auth } from "../auth";
import type { AppEnv } from "../types";
import type { UserRole } from "shared-types";

export type AuthUser = typeof auth.$Infer.Session.user;

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    if (session.user.banned) {
      return c.json({
        success: false,
        error: "Your account has been suspended",
        banReason: session.user.banReason || undefined,
      }, 403);
    }

    // Attach user to context for downstream handlers
    c.set("user", session.user);
    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ success: false, error: "Internal Server Error" }, 500);
  }
};

export const optionalAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session && !session.user.banned) {
      c.set("user", session.user);
    }
    await next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    await next();
  }
};

/**
 * Middleware that requires the authenticated user to hold one of the specified roles.
 * Returns 401 if unauthenticated, 403 if authenticated but insufficient role.
 */
export function requireRole(allowedRoles: UserRole | UserRole[]): MiddlewareHandler<AppEnv> {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (c, next) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) {
        return c.json({ success: false, error: "Unauthorized" }, 401);
      }

      if (session.user.banned) {
        return c.json({
          success: false,
          error: "Your account has been suspended",
          banReason: session.user.banReason || undefined,
        }, 403);
      }

      const userRole = (session.user.role || "user") as UserRole;
      if (!roles.includes(userRole)) {
        return c.json({
          success: false,
          error: "Forbidden: insufficient permissions",
          requiredRoles: roles,
        }, 403);
      }

      c.set("user", session.user);
      await next();
    } catch (error) {
      console.error("Role authorization middleware error:", error);
      return c.json({ success: false, error: "Internal Server Error" }, 500);
    }
  };
}

export const requireAdmin: MiddlewareHandler<AppEnv> = requireRole("admin");
export const requireModerator: MiddlewareHandler<AppEnv> = requireRole(["admin", "moderator"]);
