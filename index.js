import express from "express";
import crypto from "crypto";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;

// Servir HTML
app.use(express.static("public"));

/* =========================
   VERIFICAR TELEGRAM LOGIN
========================= */
function verifyTelegram(data) {
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

/* =========================
   LOGIN TELEGRAM (POST)
========================= */
app.post("/auth/telegram", (req, res) => {
  const data = req.body;

  if (!verifyTelegram(data)) {
    return res.status(403).send("❌ Login inválido");
  }

  // ✅ LOGIN OK
  console.log("Usuario autenticado:", data.username);

  // 👉 Redirige a la calculadora REAL
  res.redirect("/app.html");
});

/* =========================
   TEST
========================= */
app.get("/", (req, res) => {
  res.send("Telegram Login BTC Backend OK");
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});

