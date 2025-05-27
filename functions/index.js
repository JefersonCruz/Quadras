
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import next from "next";
import admin from "firebase-admin";
import ots from "opentimestamps"; // Importar com um alias, pois 'opentimestamps' é usado como namespace
import { Buffer } from "buffer"; // Importar Buffer explicitamente

// Inicializar Firebase Admin SDK apenas uma vez
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

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
    if (err.stack) {
      logger.error("Stack:", err.stack);
    }
    if (!res.headersSent) {
      res.status(500).send("Erro interno do servidor");
    }
  }
});

// Firestore trigger para registrar assinatura na blockchain
import { onDocumentWritten } from "firebase-functions/v2/firestore";

export const registrarAssinaturaNaBlockchain = onDocumentWritten("contratos/{contratoId}", async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const contratoId = event.params.contratoId;

    // Verificar se o documento foi excluído (afterData não existirá)
    if (!afterData) {
      logger.info(`Contrato ${contratoId} foi excluído. Nenhuma ação de timestamp.`);
      return null;
    }

    const statusAntes = beforeData?.status;
    const statusDepois = afterData.status;

    // Só processar se o status mudou para 'assinado'
    if (statusDepois !== 'assinado' || statusAntes === 'assinado') {
      if (statusDepois !== 'assinado') {
        logger.info(`Contrato ${contratoId} não está com status 'assinado' (status atual: ${statusDepois}). Nenhuma ação de timestamp.`);
      } else { // statusAntes era 'assinado' e statusDepois também é 'assinado'
        logger.info(`Status do contrato ${contratoId} já era 'assinado' e permaneceu 'assinado'. Nenhuma nova ação de timestamp.`);
      }
      return null;
    }

    logger.info(`Contrato ${contratoId} mudou para status 'assinado'. Processando para registro na blockchain via OpenTimestamps.`);

    // Gera o hash do contrato inteiro após todas as assinaturas
    const contratoJson = JSON.stringify(afterData);
    
    // A biblioteca opentimestamps espera um Uint8Array para fromBytes
    const contratoBuffer = Buffer.from(contratoJson, 'utf8');
    const digest = ots.DetachedTimestampFile.fromBytes(
      new Uint8Array(contratoBuffer),
      ots.Ops.OpSHA256()
    );

    try {
      await ots.stamp(digest);
      const timestampBytes = await digest.serializeToBytes();
      const timestampBase64 = Buffer.from(timestampBytes).toString("base64");

      await db
        .collection("contratos")
        .doc(contratoId)
        .collection("blockchainProof")
        .doc("opentimestamps_sha256")
        .set({
          hashTipo: "sha256",
          timestampFileBase64: timestampBase64,
          registradoEm: admin.firestore.FieldValue.serverTimestamp(),
          dadosContratoSnapshot: contratoJson,
        });

      logger.info(`Contrato ${contratoId} registrado na blockchain via OpenTimestamps com sucesso.`);
    } catch (error) {
      logger.error(`Erro ao registrar contrato ${contratoId} com OpenTimestamps:`, error);
      // Você pode querer adicionar uma lógica para tentar novamente ou notificar
    }

    return null;
  });
