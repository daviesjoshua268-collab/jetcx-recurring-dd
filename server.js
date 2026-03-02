const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

/* ===== ENABLE CORS ===== */
app.use(cors());
app.use(bodyParser.json());

/* ===== ENV VARIABLES ===== */
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = process.env.SCOPE;
const SELLER_ID = process.env.SELLER_ID;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ZAI_ENV = process.env.ZAI_ENV || "sandbox";

/* ===== TOKEN URL SWITCH ===== */
const TOKEN_URL =
  ZAI_ENV === "production"
    ? "https://au-0000.auth.assemblypay.com/tokens"
    : "https://au-0000.sandbox.auth.assemblypay.com/tokens";

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
      companyName,
      bsb,
      accountNumber,
      amount,
      signature
    } = req.body;

    if (!signature) {
      return res.status(400).json({ error: "DDR signature required" });
    }

    if (!firstName || !lastName || !email || !bsb || !accountNumber || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const timestamp = new Date().toISOString();
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    /* ===== MASK ACCOUNT DETAILS ===== */
    const maskedAccount =
      accountNumber.length > 3
        ? "****" + accountNumber.slice(-3)
        : accountNumber;

    /* ===== SEND DDR EMAIL COPY ===== */
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
      subject: "New Signed Direct Debit Request",
      html: `
        <h2>Direct Debit Request Signed</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Company:</strong> ${companyName || "N/A"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>BSB:</strong> ${bsb}</p>
        <p><strong>Account:</strong> ${maskedAccount}</p>
        <p><strong>Signature:</strong> ${signature}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <hr>
        <p>This Direct Debit is authorised under the BECS framework via Zai Australia Pty Ltd (User IDs 342203 & 481561).</p>
      `
    });

    /* ===== GET ZAI TOKEN ===== */
    const tokenResponse = await axios.post(
      TOKEN_URL,
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

    if (!accessToken) {
      return res.status(500).json({ error: "Failed to obtain Zai token" });
    }

    res.json({
      success: true,
      message: "Direct Debit setup successful"
    });

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error_description || "Setup failed"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});