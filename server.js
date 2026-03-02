const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());

/* ===== SANDBOX CONFIG ===== */
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = process.env.SCOPE;
const SELLER_ID = process.env.SELLER_ID;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

/* ===== HEALTH CHECK ===== */
app.get("/", (req, res) => {
  res.send("Jet CX Recurring Direct Debit Backend Live");
});

/* ===== SETUP RECURRING ===== */
app.post("/setup-recurring", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      bsb,
      accountNumber,
      amount,
      signature
    } = req.body;

    if (!signature) {
      return res.status(400).json({ error: "DDR signature required" });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    /* ===== SEND DDR EMAIL ===== */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Jet CX DDR" <${EMAIL_USER}>`,
      to: "hello@jetcx.com.au",
      subject: "New Recurring DDR Signed",
      html: `
        <h2>Recurring DDR</h2>
        <p>Name: ${firstName} ${lastName}</p>
        <p>Email: ${email}</p>
        <p>Amount: $${amount}</p>
        <p>Signature: ${signature}</p>
      `
    });

    /* ===== GET ZAI TOKEN ===== */
    const tokenResponse = await axios.post(
      "https://au-0000.sandbox.auth.assemblypay.com/tokens",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: SCOPE
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    res.json({
      success: true,
      message: "Token + DDR successful",
      token_preview: accessToken.substring(0, 10) + "..."
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Setup failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});