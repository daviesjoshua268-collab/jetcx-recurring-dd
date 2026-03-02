const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/* ===== ENV VARIABLES ===== */
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPE = process.env.SCOPE;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ZAI_ENV = process.env.ZAI_ENV || "sandbox";

/* ===== TOKEN URL SWITCH ===== */
const TOKEN_URL =
  ZAI_ENV === "production"
    ? "https://au-0000.auth.assemblypay.com/tokens"
    : "https://au-0000.sandbox.auth.assemblypay.com/tokens";

/* ===== FRONTEND PAGE ===== */
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Jet CX Direct Debit</title>
    <style>
      body { font-family:-apple-system,sans-serif;background:#f4f6f9; }
      .container {
        max-width:700px;margin:40px auto;background:#fff;
        padding:30px;border-radius:12px;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
      }
      input {
        width:100%;padding:12px;margin:8px 0;
        border-radius:8px;border:1px solid #ddd;
      }
      button {
        width:100%;padding:14px;
        background:#2e6df6;color:white;
        border:none;border-radius:8px;
        font-size:15px;cursor:pointer;
      }
      .ddr-box {
        max-height:220px;
        overflow-y:auto;
        background:#f2f4f8;
        padding:15px;
        font-size:12px;
        border-radius:8px;
        margin-bottom:15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Setup Direct Debit</h2>

      <form method="POST" action="/setup-recurring">

        <h3>Payer Information</h3>
        <input name="firstName" placeholder="First Name" required>
        <input name="lastName" placeholder="Last Name" required>
        <input name="email" type="email" placeholder="Email" required>
        <input name="companyName" placeholder="Company Name (if applicable)">

        <h3>Banking Details</h3>
        <input name="bsb" placeholder="BSB (6 digits)" maxlength="6" required>
        <input name="accountNumber" placeholder="Account Number" required>
        <input name="amount" type="number" step="0.01" placeholder="Recurring Amount (AUD)" required>

        <h3>Direct Debit Request</h3>
        <div class="ddr-box">
          You request and authorise Zai Australia Pty Ltd
          as agent for Jet CX to debit your nominated account
          via the BECS framework for amounts payable under
          your agreement.
          <br><br>
          By proceeding you confirm you have read and agreed
          to the Direct Debit Request Service Agreement.
        </div>

        <label>
          <input type="checkbox" required>
          I authorise this Direct Debit.
        </label>

        <input name="signature" placeholder="Type Full Name as Signature" required>

        <button type="submit">Pay & Authorize</button>

      </form>
    </div>
  </body>
  </html>
  `);
});

/* ===== FORM SUBMISSION ===== */
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

    const timestamp = new Date().toISOString();
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const maskedAccount =
      accountNumber.length > 3
        ? "****" + accountNumber.slice(-3)
        : accountNumber;

    /* ===== SEND DDR EMAIL ===== */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
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
        <p><strong>IP:</strong> ${ipAddress}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
      `
    });

    /* ===== GET ZAI TOKEN ===== */
    await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: SCOPE
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    /* ===== SUCCESS PAGE ===== */
    res.send(`
      <div style="text-align:center;margin-top:100px;font-family:sans-serif;">
        <h2>Direct Debit Setup Successful</h2>
        <p>Your recurring debit request has been received.</p>
      </div>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).send("Setup failed. Please try again.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});