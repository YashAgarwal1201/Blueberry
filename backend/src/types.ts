import type { AuthUser } from "./middleware/authMiddleware";

export type AppEnv = {
  Variables: {
    user?: AuthUser;
  };
};
