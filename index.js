import express from "express";
import crypto from "crypto";
import path from "path";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

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

app.post("/auth", async (req, res) => {
  const data = req.body;

  if (!checkTelegramAuth(data)) {
    return res.status(403).send("Auth inválido");
  }

  const userId = data.id;

  const tg = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${GROUP_ID}&user_id=${userId}`
  ).then(r => r.json());

  if (!tg.ok || ["left", "kicked"].includes(tg.result.status)) {
    return res.status(403).send("No estás en el grupo");
  }

  res.redirect("/?access=granted");
});

app.listen(process.env.PORT || 8080, () =>
  console.log("Servidor listo")
);

