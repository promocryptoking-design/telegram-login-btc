import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 8080;

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function checkTelegramAuth(data) {
  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const checkString = Object.keys(data)
    .filter(k => k !== "hash")
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return hmac === data.hash;
}

async function isUserInGroup(userId) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${userId}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.ok) return false;

  return ["member", "administrator", "creator"].includes(json.result.status);
}

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Acceso comunidad</title>
<script src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="AlertasTradingVip_bot"
        data-size="large"
        data-userpic="false"
        data-lang="es"
        data-request-access="write"
        data-auth-url="/auth">
</script>
</head>
<body style="background:#020a13;color:#fff;text-align:center;margin-top:120px">
<h2>AccESO EXCLUSIVO COMUNIDAD</h2>
<p>Inicia sesión con Telegram para continuar</p>
</body>
</html>
  `);
});

app.get("/auth", async (req, res) => {
  const data = req.query;

  if (!checkTelegramAuth(data)) {
    return res.send("❌ Autenticación inválida");
  }

  const userId = data.id;
  const allowed = await isUserInGroup(userId);

  if (!allowed) {
    return res.send("❌ No perteneces a la comunidad privada");
  }

  const html = fs.readFileSync(path.join(process.cwd(), "app.html"), "utf8");
  res.send(html);
});

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
