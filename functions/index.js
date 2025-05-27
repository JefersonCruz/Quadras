
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
    // Usar event.data.before e event.data.after para v2
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const contratoId = event.params.contratoId;

    // Verificar se o documento foi excluído (afterData não existirá)
    if (!afterData) {
      logger.info(`Contrato ${contratoId} foi excluído. Nenhuma ação de timestamp.`);
      return null;
    }
    // Se beforeData não existe, é uma criação, não uma atualização.
    // Poderíamos tratar a criação também, mas o prompt foca na assinatura do cliente que é uma atualização.
    if (!beforeData) {
      logger.info(`Contrato ${contratoId} foi criado. Esperando assinatura do cliente para timestamp.`);
      return null;
    }

    // Só processar se mudou o campo "assinaturas.cliente.dataHora"
    const assinaturaAntes = beforeData.assinaturas?.cliente?.dataHora || null;
    const assinaturaDepois = afterData.assinaturas?.cliente?.dataHora || null;

    if (assinaturaAntes === assinaturaDepois || !assinaturaDepois) {
      logger.info(`Assinatura do cliente para o contrato ${contratoId} não foi alterada ou não existe. Nenhuma ação de timestamp.`);
      return null;
    }

    logger.info(`Processando contrato ${contratoId} para registro na blockchain via OpenTimestamps.`);

    // Gera o hash do contrato inteiro após assinatura
    const contratoJson = JSON.stringify(afterData); // Usar afterData
    
    // A biblioteca opentimestamps espera um Uint8Array para fromBytes
    const contratoBuffer = Buffer.from(contratoJson, 'utf8');
    const digest = ots.DetachedTimestampFile.fromBytes(
      new Uint8Array(contratoBuffer), // Converter Buffer para Uint8Array
      ots.Ops.OpSHA256() // Chamar OpSHA256 como uma função
    );

    // Solicita o carimbo de tempo na blockchain
    // O método stamp pode precisar de configuração de calendário se os padrões não funcionarem.
    // A biblioteca pode usar servidores de calendário públicos por padrão.
    try {
      await ots.stamp(digest);
      const timestampBytes = await digest.serializeToBytes();
      const timestampBase64 = Buffer.from(timestampBytes).toString("base64");

      // Armazena o hash e timestamp no Firestore (subcoleção do contrato)
      await db
        .collection("contratos")
        .doc(contratoId)
        .collection("blockchainProof") // Nome mais descritivo
        .doc("opentimestamps_sha256")    // ID do documento mais descritivo
        .set({
          hashTipo: "sha256",
          timestampFileBase64: timestampBase64, // Nome do campo mais claro
          registradoEm: admin.firestore.FieldValue.serverTimestamp(),
          dadosContratoSnapshot: contratoJson, // Opcional: snapshot dos dados carimbados para referência
        });

      logger.info(`Contrato ${contratoId} registrado na blockchain via OpenTimestamps com sucesso.`);
    } catch (error) {
      logger.error(`Erro ao registrar contrato ${contratoId} com OpenTimestamps:`, error);
      // Você pode querer adicionar uma lógica para tentar novamente ou notificar
    }

    return null;
  });
