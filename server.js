const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/* ===== FRONTEND PAGE ===== */
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Jet CX Direct Debit</title>
    <style>
      body {
        font-family:-apple-system,sans-serif;
        background:#f4f6f9;
      }

      .container {
        max-width:700px;
        margin:40px auto;
        background:#fff;
        padding:30px;
        border-radius:12px;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
      }

      input {
        width:100%;
        padding:12px;
        margin:8px 0;
        border-radius:8px;
        border:1px solid #ddd;
      }

      button {
        width:100%;
        padding:14px;
        background:#2e6df6;
        color:white;
        border:none;
        border-radius:8px;
        font-size:15px;
        cursor:pointer;
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

      .error {
        text-align:center;
        margin-top:100px;
        font-family:sans-serif;
        color:red;
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
          <br><br>
          This authority remains in force until cancelled.
          You may request cancellation at any time.
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
app.post("/setup-recurring", (req, res) => {
  console.log("FORM RECEIVED");

  res.send(`
    <div class="success">
      <h2>SUCCESS REACHED</h2>
      <p>The form submitted correctly.</p>
    </div>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});