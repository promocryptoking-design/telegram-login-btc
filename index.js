import express from "express";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;
const PORT = process.env.PORT || 8080;

/* --------- UTILIDAD: VALIDAR FIRMA TELEGRAM --------- */
function isValidTelegramAuth(data) {
  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const checkString = Object.keys(data)
    .filter(k => k !== "hash")
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");

  const hash = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return hash === data.hash;
}

/* --------- HEALTH CHECK --------- */
app.get("/", (req, res) => {
  res.send("Telegram Login BTC Backend OK");
});

/* --------- LOGIN TELEGRAM --------- */
app.post("/auth/telegram", async (req, res) => {
  const user = req.body;

  // 1️⃣ Validar firma
  if (!isValidTelegramAuth(user)) {
    return res.json({ ok: false, error: "Firma inválida" });
  }

  // 2️⃣ Verificar grupo
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${user.id}`;

  try {
    const tgRes = await fetch(url);
    const tgData = await tgRes.json();

    if (
      tgData.ok &&
      ["member", "administrator", "creator"].includes(tgData.result.status)
    ) {
      return res.json({ ok: true });
    } else {
      return res.json({ ok: false });
    }
  } catch (e) {
    return res.json({ ok: false, error: "Telegram error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

