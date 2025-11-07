import { Request, Response, NextFunction } from "express";

const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(
    `Log: [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );

  // It passes control to the next middleware or route handler
  next();
};

export { loggerMiddleware };
