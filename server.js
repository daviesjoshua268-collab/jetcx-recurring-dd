const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());

/* ===== SANDBOX CONFIG (TEMP HARD-CODED) ===== */
const CLIENT_ID = "3m0citah728tgv2gapuvqefs98";
const CLIENT_SECRET = "1dbicnscqpmqpjvb5cl97j4ne1e6v7hh9achnjq3gibursfqpmi1";
const SCOPE = "im-au-11/e74c6020-ee82-013e-a094-0a58a9feac03:c4631aa7-b3f2-4975-be6f-2d5a812e9896:3";
const SELLER_ID = "31b75a5355e7ffa81bbfbdbccb201d2a";
";

const EMAIL_USER = "hello@jetcx.com.au";
const EMAIL_PASS = "szdd wfjn yghv qmxj";

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

    /* SEND DDR EMAIL */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"Jet CX DDR" <${EMAIL_USER}>`,
      to: "hello@jetcx.com.au",
      subject: "New Recurring DDR Signed",
      html: `
        <h2>Recurring DDR</h2>
        <p>${firstName} ${lastName}</p>
        <p>${email}</p>
        <p>$${amount}</p>
        <p>Signature: ${signature}</p>
      `
    });

    /* GET ZAI TOKEN */
    const tokenResponse = await axios.post(
      "https://au-0000.sandbox.auth.assemblypay.com/tokens",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: 3m0citah728tgv2gapuvqefs98,
        client_secret:1dbicnscqpmqpjvb5cl97j4ne1e6v7hh9achnjq3gibursfqpmi1,
        scope im-au-11/e74c6020-ee82-013e-a094-0a58a9feac03:c4631aa7-b3f2-4975-be6f-2d5a812e9896:3
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
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