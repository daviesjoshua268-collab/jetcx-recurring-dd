const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

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
        height:200px;
        overflow-y:scroll;
        background:#f2f4f8;
        padding:15px;
        font-size:12px;
        border-radius:8px;
        margin-bottom:15px;
        border:1px solid #ddd;
      }
      .success {
        text-align:center;
        margin-top:100px;
        font-family:sans-serif;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Setup Direct Debit</h2>

      <form method="POST" action="/setup-recurring">
        <h3>Payer Information</h3>
        <input name="firstName" required placeholder="First Name">
        <input name="lastName" required placeholder="Last Name">
        <input name="email" required type="email" placeholder="Email">
        <input name="companyName" placeholder="Company Name (if applicable)">

        <h3>Banking Details</h3>
        <input name="bsb" required placeholder="BSB">
        <input name="accountNumber" required placeholder="Account Number">
        <input name="amount" required type="number" step="0.01" placeholder="Amount">

        <h3>Direct Debit Request</h3>
        <div class="ddr-box">
          You authorise Jet CX via BECS to debit your nominated account.
        </div>

        <label>
          <input type="checkbox" required>
          I authorise this Direct Debit.
        </label>

        <input name="signature" required placeholder="Type Full Name as Signature">

        <button type="submit">Pay & Authorize</button>
      </form>
    </div>
  </body>
  </html>
  `);
});

/* ===== FORM SUBMISSION ===== */
app.post("/setup-recurring", (req, res) => {

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
  const maskedAccount =
    accountNumber.length > 3
      ? "****" + accountNumber.slice(-3)
      : accountNumber;

  /* ===== SEND SUCCESS PAGE IMMEDIATELY ===== */
  res.send(`
    <div class="success">
      <h2>Direct Debit Setup Successful</h2>
      <p>Your request has been received.</p>
    </div>
  `);

  /* ===== SEND EMAIL IN BACKGROUND ===== */
  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      },
      connectionTimeout: 10000
    });

    transporter.sendMail({
      from: "Jet CX DDR <" + EMAIL_USER + ">",
      to: "hello@jetcx.com.au",
      subject: "New Signed Direct Debit Request",
      html:
        "<h2>Direct Debit Request Signed</h2>" +
        "<p>Name: " + firstName + " " + lastName + "</p>" +
        "<p>Company: " + (companyName || "N/A") + "</p>" +
        "<p>Email: " + email + "</p>" +
        "<p>Amount: $" + amount + "</p>" +
        "<p>BSB: " + bsb + "</p>" +
        "<p>Account: " + maskedAccount + "</p>" +
        "<p>Signature: " + signature + "</p>" +
        "<p>Timestamp: " + timestamp + "</p>"
    })
    .then(() => console.log("Email sent"))
    .catch(err => console.error("Email failed:", err));

  } catch (err) {
    console.error("Transport error:", err);
  }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});