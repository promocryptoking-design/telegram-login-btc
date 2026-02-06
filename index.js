import express from "express";
import crypto from "crypto";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8080;

// 🔐 TOKEN DEL BOT
const BOT_TOKEN = process.env.BOT_TOKEN || "PEGA_AQUI_EL_TOKEN_DE_AlertasTradingVip_bot";

// 📁 Servir HTML
app.use(express.static("public"));

// 🧠 Verificación oficial Telegram
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

// ✅ RUTA QUE FALTABA (ESTE ERA EL ERROR)
app.get("/auth/telegram", (req, res) => {
  const data = req.query;

  if (!data || !data.hash) {
    return res.status(400).send("❌ Datos inválidos");
  }

  const isValid = checkTelegramAuth(data);

  if (!isValid) {
    return res.status(403).send("❌ Autenticación Telegram inválida");
  }

  // ✅ ACCESO CONCEDIDO
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Acceso concedido</title>
      <style>
        body{
          background:#020a13;
          color:#00ff9c;
          font-family:Arial;
          display:flex;
          align-items:center;
          justify-content:center;
          height:100vh;
        }
        .box{
          border:1px solid #00ff9c;
          padding:30px;
          border-radius:12px;
          text-align:center;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>✅ Acceso concedido</h2>
        <p>Bienvenido <b>${data.first_name}</b></p>
        <p>@${data.username || "sin_username"}</p>
      </div>
    </body>
    </html>
  `);
});

// 🔁 Fallback
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

// 🚀 Start
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
