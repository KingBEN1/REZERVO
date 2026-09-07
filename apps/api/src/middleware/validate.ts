import type { RequestHandler } from 'express';
import type { z } from 'zod';

export const validate = (schema: z.ZodTypeAny): RequestHandler => (req, _res, next) => {
  // GET requests normally have no body; validators that only use query/path
  // input must receive an empty object rather than fail on an absent body.
  const parsed = schema.parse({ body: req.body ?? {}, query: req.query, params: req.params });
  req.body = parsed.body;
  next();
};
