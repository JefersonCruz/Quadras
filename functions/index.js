
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import next from "next";
import admin from "firebase-admin";
// import ots from "opentimestamps"; // Temporarily commented out
// import { Buffer } from "buffer"; // Temporarily commented out if only used by ots

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
  logger.info("NextApp Request URL:", req.originalUrl);

  try {
    await app.prepare(); // prepara o app Next.js
    return handle(req, res); // delega o request para o Next
  } catch (err) {
    logger.error("❌ Erro no Next.js:", err, { stack: err.stack });
    if (!res.headersSent) {
      res.status(500).send("Erro interno do servidor");
    }
  }
});

// Firestore trigger para registrar assinatura na blockchain
// import { onDocumentWritten } from "firebase-functions/v2/firestore";

/*
// Temporarily commented out registrarAssinaturaNaBlockchain
export const registrarAssinaturaNaBlockchain = onDocumentWritten("contratos/{contratoId}", async (event) => {
    const contratoId = event.params.contratoId;
    logger.info(`[registrarAssinaturaNaBlockchain] Triggered for contratoId: ${contratoId}`);

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Verificar se o documento foi excluído (afterData não existirá)
    if (!afterData) {
      logger.info(`[registrarAssinaturaNaBlockchain] Contrato ${contratoId} foi excluído. Nenhuma ação de timestamp.`);
      return null;
    }

    const statusAntes = beforeData?.status;
    const statusDepois = afterData.status;

    logger.info(`[registrarAssinaturaNaBlockchain] Status before: ${statusAntes}, Status after: ${statusDepois} for ${contratoId}`);

    // Só processar se o status mudou para 'assinado'
    if (statusDepois !== 'assinado' || statusAntes === 'assinado') {
      if (statusDepois !== 'assinado') {
        logger.info(`[registrarAssinaturaNaBlockchain] Contrato ${contratoId} não está com status 'assinado' (status atual: ${statusDepois}). Nenhuma ação de timestamp.`);
      } else { // statusAntes era 'assinado' e statusDepois também é 'assinado'
        logger.info(`[registrarAssinaturaNaBlockchain] Status do contrato ${contratoId} já era 'assinado' e permaneceu 'assinado'. Nenhuma nova ação de timestamp.`);
      }
      return null;
    }

    logger.info(`[registrarAssinaturaNaBlockchain] Contrato ${contratoId} mudou para status 'assinado'. Iniciando processo de registro na blockchain via OpenTimestamps.`);

    // Gera o hash do contrato inteiro após todas as assinaturas
    const contratoJson = JSON.stringify(afterData);
    
    // A biblioteca opentimestamps espera um Uint8Array para fromBytes
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
        dadosContratoSnapshot: contratoJson, // Snapshot do contrato no momento do timestamp
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
      // Você pode querer adicionar uma lógica para tentar novamente ou notificar o admin
      // Ex: await db.collection("errosRegistrosBlockchain").add({ contratoId, erro: error.message, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    }

    return null;
  });
*/
