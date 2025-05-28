
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import next from "next";
import admin from "firebase-admin";
// import ots from "opentimestamps"; // Commented out
// import { Buffer } from "buffer"; // Commented out

// Initialize Firebase Admin SDK only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

const REGION = "us-central1";
const IS_DEV = process.env.NODE_ENV !== "production";

// Ensures the .next path is correct
const app = next({
  dev: IS_DEV,
  conf: { distDir: ".next" },
});

const handle = app.getRequestHandler();

export const nextApp = onRequest({ region: REGION }, async (req, res) => {
  logger.info(`[NextApp] Request received for URL: ${req.originalUrl}`);

  try {
    logger.info("[NextApp] Preparing Next.js app...");
    await app.prepare(); // prepares the Next.js app
    logger.info("[NextApp] Next.js app prepared. Delegating to Next.js request handler.");
    return handle(req, res); // delegates the request to Next
  } catch (err) {
    logger.error("❌ Erro no Next.js:", err, { stack: err.stack });
    if (!res.headersSent) {
      res.status(500).send("Erro interno do servidor");
    }
  }
});

// Firestore trigger for blockchain signature registration
import { onDocumentWritten } from "firebase-functions/v2/firestore";

/* // Commenting out the entire function as it depends on opentimestamps
export const registrarAssinaturaNaBlockchain = onDocumentWritten("contratos/{contratoId}", async (event) => {
    const contratoId = event.params.contratoId;
    logger.info(`[registrarAssinaturaNaBlockchain] Triggered for contratoId: ${contratoId}`);

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Check if the document was deleted (afterData will not exist)
    if (!afterData) {
      logger.info(`[registrarAssinaturaNaBlockchain] Contrato ${contratoId} foi excluído. Nenhuma ação de timestamp.`);
      return null;
    }

    const statusAntes = beforeData?.status;
    const statusDepois = afterData.status;

    logger.info(`[registrarAssinaturaNaBlockchain] Status before: ${statusAntes}, Status after: ${statusDepois} for ${contratoId}`);

    // Only process if the status changed to 'assinado' and was not 'assinado' before
    if (statusDepois !== 'assinado' || statusAntes === 'assinado') {
      if (statusDepois !== 'assinado') {
        logger.info(`[registrarAssinaturaNaBlockchain] Contrato ${contratoId} não está com status 'assinado' (status atual: ${statusDepois}). Nenhuma ação de timestamp.`);
      } else { // statusAntes was 'assinado' and statusDepois is also 'assinado'
        logger.info(`[registrarAssinaturaNaBlockchain] Status do contrato ${contratoId} já era 'assinado' e permaneceu 'assinado'. Nenhuma nova ação de timestamp.`);
      }
      return null;
    }

    logger.info(`[registrarAssinaturaNaBlockchain] Contrato ${contratoId} mudou para status 'assinado'. Iniciando processo de registro na blockchain via OpenTimestamps.`);

    // Generate the hash of the entire contract after all signatures
    const contratoJson = JSON.stringify(afterData);
    
    // opentimestamps library expects a Uint8Array for fromBytes
    const contratoBuffer = Buffer.from(contratoJson, 'utf8');
    const digest = ots.DetachedTimestampFile.fromBytes(
      new Uint8Array(contratoBuffer),
      ots.Ops.OpSHA256()
    );
    logger.info(`[registrarAssinaturaNaBlockchain] Hash gerado para contrato ${contratoId}.`);

    try {
      logger.info(`[registrarAssinaturaNaBlockchain] Enviando hash para OpenTimestamps para ${contratoId}...`);
      await ots.stamp(digest);
      logger.info(`[registrarAssinaturaNaBlockchain] Hash para ${contratoId} carimbado com sucesso por OpenTimestamps.`);
      
      const timestampBytes = await digest.serializeToBytes();
      const timestampBase64 = Buffer.from(timestampBytes).toString("base64");
      logger.info(`[registrarAssinaturaNaBlockchain] Arquivo de timestamp serializado para Base64 para ${contratoId}.`);

      const proofData = {
        hashTipo: "sha256",
        timestampFileBase64: timestampBase64,
        registradoEm: admin.firestore.FieldValue.serverTimestamp(),
        dadosContratoSnapshot: contratoJson, // Snapshot of the contract at the time of timestamping
      };

      await db
        .collection("contratos")
        .doc(contratoId)
        .collection("blockchainProof")
        .doc("opentimestamps_sha256")
        .set(proofData);

      logger.info(`[registrarAssinaturaNaBlockchain] Contrato ${contratoId} registrado na blockchain via OpenTimestamps com sucesso. Prova salva em subcoleção.`);
    } catch (error) {
      logger.error(`[registrarAssinaturaNaBlockchain] Erro ao registrar contrato ${contratoId} com OpenTimestamps ou salvar prova:`, error, { stack: error.stack });
      // You might want to add logic to retry or notify the admin
      // Ex: await db.collection("errosRegistrosBlockchain").add({ contratoId, erro: error.message, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    }

    return null;
  });
*/
