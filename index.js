import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

// ---------- UTILIDAD: VALIDAR LOGIN TELEGRAM ----------
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

// ---------- LOGIN ----------
app.post("/auth", async (req, res) => {
  const data = req.body;

  if (!checkTelegramAuth(data)) {
    return res.status(401).json({ error: "Auth inválido" });
  }

  const userId = data.id;

  // Verificar si está en el grupo
  const tg = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${userId}`
  );
  const json = await tg.json();

  if (!json.ok) {
    return res.status(403).json({ error: "No pertenece al grupo" });
  }

  const status = json.result.status;
  const allowed = ["member", "administrator", "creator"];

  if (!allowed.includes(status)) {
    return res.status(403).json({ error: "No autorizado" });
  }

  // OK → redirige a calculadora
  res.redirect("/app");
});

// ---------- APP ----------
app.get("/app", (req, res) => {
  res.sendFile(process.cwd() + "/public/app.html");
});

// ---------- TEST ----------
app.get("/", (req, res) => {
  res.send("Telegram Login BTC Backend OK");
});

app.listen(8080, () => {
  console.log("Server running on port 8080");
});

