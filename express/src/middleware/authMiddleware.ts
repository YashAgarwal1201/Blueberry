import { Request, Response, NextFunction } from "express";
import { auth } from "../auth";
import { fromNodeHeaders } from "better-auth/node";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Attach user to request for downstream handlers
    (req as any).user = session.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      (req as any).user = session.user;
    }
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next();
  }
};
