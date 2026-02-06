import express from "express";
import axios from "axios";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;
const PORT = process.env.PORT || 8080;

// =================================
// Validar Telegram login legítimo
// =================================
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

// =================================
// Endpoint de autenticación
// =================================
app.post("/auth/telegram", async (req, res) => {
  const user = req.body;

  if (!checkTelegramAuth(user)) {
    return res.status(401).json({ error: "Telegram auth inválido" });
  }

  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      {
        params: {
          chat_id: GROUP_ID,
          user_id: user.id
        }
      }
    );

    const status = response.data.result.status;
    const allowed = ["creator", "administrator", "member"];

    if (!allowed.includes(status)) {
      return res.status(403).json({ error: "No pertenece al grupo" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        username: user.username
      }
    });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Error validando grupo" });
  }
});

// =================================
// Health check
// =================================
app.get("/", (req, res) => {
  res.send("Telegram Login BTC Backend OK");
});

// =================================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
