import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👉 SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// =======================
// TELEGRAM CONFIG
// =======================
const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

// =======================
// TELEGRAM AUTH CHECK
// =======================
function checkTelegramAuth(data) {
  const hash = data.hash;
  delete data.hash;

  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const checkString = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return hmac === hash;
}

// =======================
// LOGIN CALLBACK
// =======================
app.post("/auth", async (req, res) => {
  if (!checkTelegramAuth({ ...req.body })) {
    return res.status(403).send("Auth failed");
  }

  const userId = req.body.id;

  const tgRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${userId}`
  );

  const tgData = await tgRes.json();

  if (!["member", "administrator", "creator"].includes(tgData?.result?.status)) {
    return res.status(403).send("No eres miembro del grupo");
  }

  // LOGIN OK → REDIRECT AL FRONT
  res.redirect("/");
});

// =======================
// ROOT → HTML
// =======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =======================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Servidor listo en puerto", PORT);
});

