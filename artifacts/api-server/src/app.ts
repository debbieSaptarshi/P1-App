import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { errorHandler, HttpError } from './lib/errors';
import { rateLimit } from './lib/rate-limit';
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.disable('x-powered-by');
app.use((_req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'no-store'); next(); });
app.use(cors({ origin(origin, cb) {
  const allowed = (process.env.CORS_ORIGINS ?? 'http://localhost:8081,http://localhost:19006').split(',').map(s => s.trim());
  cb(origin && !allowed.includes(origin) ? new HttpError(403, 'ORIGIN_DENIED', 'Origin is not allowed.') : null, true);
} }));
app.use(rateLimit(300, 'ip'));
app.use(express.json({ limit: "13mb" }));


app.use("/api", router);

app.use((_req, res) => { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }); });
app.use(errorHandler);
export default app;
