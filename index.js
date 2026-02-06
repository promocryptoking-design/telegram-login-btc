import express from "express";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 8080;

// 🔐 TOKEN DEL BOT
const BOT_TOKEN = process.env.BOT_TOKEN || "PEGA_AQUI_EL_TOKEN_DEL_BOT";

// Para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir frontend
app.use(express.static(path.join(__dirname, "public")));

/* ===========================
   VALIDACIÓN TELEGRAM
=========================== */
function checkTelegramAuth(data) {
  const { hash, ...rest } = data;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return hmac === hash;
}

/* ===========================
   RUTA TELEGRAM LOGIN (GET)
=========================== */
app.get("/auth/telegram", (req, res) => {
  if (!checkTelegramAuth(req.query)) {
    return res.redirect("/?error=telegram_invalid");
  }

  const username = req.query.username || "usuario";

  // ✅ LOGIN OK → REDIRIGIR A CALCULADORA
  res.redirect(
    `https://dcabtcrypto.promocryptoking.workers.dev/?user=${username}`
  );
});

/* ===========================
   ROOT
=========================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.listen(PORT, () => {
  console.log("✅ Telegram Login BTC Backend activo en puerto", PORT);
});
