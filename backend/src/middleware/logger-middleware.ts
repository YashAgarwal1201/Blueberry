import type { MiddlewareHandler } from "hono";

export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
  const url = new URL(c.req.url);
  console.log(
    `Log: [${new Date().toISOString()}] ${c.req.method} ${url.pathname}${url.search}`
  );
  await next();
};
