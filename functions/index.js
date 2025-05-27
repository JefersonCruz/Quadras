import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import next from "next";

const REGION = "us-central1";
const IS_DEV = process.env.NODE_ENV !== "production";

// Garante que o caminho .next esteja correto
const app = next({
  dev: IS_DEV,
  conf: { distDir: ".next" },
});

const handle = app.getRequestHandler();

export const nextApp = onRequest({ region: REGION }, async (req, res) => {
  logger.info("📥 Request URL:", req.originalUrl);

  try {
    await app.prepare(); // prepara o app Next.js
    return handle(req, res); // delega o request para o Next
  } catch (err) {
    logger.error("❌ Erro no Next.js:", err);
    if (!res.headersSent) {
      res.status(500).send("Erro interno do servidor");
    }
  }
});
