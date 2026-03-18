/**
 * Email Service — SendGrid
 * All 50/50 Life transactional emails
 */
const sgMail = require('@sendgrid/mail');
const logger = require('../config/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = { email: process.env.FROM_EMAIL || 'noreply@5050life.com', name: '50/50 Life' };

// ── HTML email wrapper ──────────────────────────────────────────────────────
function emailWrapper(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #CC0000 0%, #0033CC 100%); padding: 32px; text-align: center; }
    .logo { font-size: 36px; font-weight: 900; color: white; letter-spacing: -1px; }
    .logo span { opacity: 0.8; font-weight: 400; font-size: 20px; display: block; margin-top: 4px; }
    .body { padding: 40px 32px; color: #212121; line-height: 1.6; }
    .btn { display: inline-block; background: #CC0000; color: white; text-decoration: none;
           padding: 14px 32px; border-radius: 8px; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .btn-blue { background: #0033CC; }
    .footer { background: #f8f8f8; padding: 24px 32px; text-align: center; font-size: 12px; color: #888; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .highlight { background: #FFF3E0; border-left: 4px solid #F57C00; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
    .win-box { background: #E8F5E9; border-left: 4px solid #2E7D32; padding: 12px 16px; border-radius: 4px; }
    .loss-box { background: #FFEBEE; border-left: 4px solid #C62828; padding: 12px 16px; border-radius: 4px; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <div class="logo">50/50 Life<span>Where Every Bet is a 50/50 Shot</span></div>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>© 2026 50/50 Life. All rights reserved.</p>
        <p>Gamble responsibly. 18+ only. If you need help, contact <a href="https://www.begambleaware.org">BeGambleAware.org</a></p>
        <p><a href="{{unsubscribeUrl}}">Unsubscribe from marketing emails</a> | <a href="https://5050life.com/privacy">Privacy Policy</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Send helper ─────────────────────────────────────────────────────────────
async function send(to, subject, htmlContent, text) {
  try {
    await sgMail.send({
      to, from: FROM, subject,
      html: emailWrapper(htmlContent),
      text: text || subject
    });
    logger.info(`Email sent: ${subject} → ${to}`);
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err.response?.body || err.message);
  }
}

// ── Email templates ─────────────────────────────────────────────────────────
const emailService = {

  async sendVerificationEmail(email, username, token) {
    const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    await send(email, 'Verify your 50/50 Life account', `
      <h2>Welcome to 50/50 Life, @${username}! 🎯</h2>
      <p>You're almost in. Verify your email address to activate your account and start placing bets.</p>
      <a href="${link}" class="btn">Verify My Email</a>
      <div class="highlight">
        <strong>This link expires in 24 hours.</strong> If you didn't create an account, you can safely ignore this email.
      </div>
    `);
  },

  async sendPasswordResetEmail(email, username, token) {
    const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await send(email, 'Reset your 50/50 Life password', `
      <h2>Password Reset Request</h2>
      <p>Hi @${username}, we received a request to reset your password.</p>
      <a href="${link}" class="btn">Reset My Password</a>
      <div class="highlight">
        <strong>This link expires in 1 hour.</strong> If you didn't request this, your account is safe — no action needed.
      </div>
    `);
  },

  async sendBetWonEmail(email, username, betData) {
    await send(email, `🎉 You won $${betData.netPayout.toFixed(2)}!`, `
      <h2>Congratulations @${username}! 🏆</h2>
      <p>Your bet came through. Here's your winning breakdown:</p>
      <div class="win-box">
        <strong>Event:</strong> ${betData.eventName}<br>
        <strong>Your Pick:</strong> ${betData.selection}<br>
        <strong>Stake:</strong> $${betData.stake}<br>
        <strong>Gross Payout:</strong> $${betData.grossPayout.toFixed(2)}<br>
        <strong>50/50 Life Commission (10%):</strong> -$${betData.commission.toFixed(2)}<br>
        <strong style="color:#2E7D32; font-size:18px;">Net Winnings: $${betData.netPayout.toFixed(2)}</strong>
      </div>
      <p>Your winnings have been added to your wallet. Ready to place another bet?</p>
      <a href="${process.env.FRONTEND_URL}/betting" class="btn btn-blue">Place Another Bet</a>
    `);
  },

  async sendBetLostEmail(email, username, betData) {
    await send(email, `Bet Result: ${betData.eventName}`, `
      <h2>Tough luck, @${username}</h2>
      <p>Your bet didn't come through this time:</p>
      <div class="loss-box">
        <strong>Event:</strong> ${betData.eventName}<br>
        <strong>Your Pick:</strong> ${betData.selection}<br>
        <strong>Stake:</strong> $${betData.stake}<br>
        <strong>Result:</strong> Loss
      </div>
      <p>Don't worry — there are always more opportunities. Browse the latest bets and challenges on 50/50 Life.</p>
      <a href="${process.env.FRONTEND_URL}" class="btn">Back to the Action</a>
      <hr class="divider">
      <p style="font-size:12px; color:#888;">Need a break? You can set <a href="${process.env.FRONTEND_URL}/settings/responsible-gambling">deposit limits or take a timeout</a> at any time.</p>
    `);
  },

  async sendDepositConfirmationEmail(email, username, amount) {
    await send(email, `Deposit confirmed: $${amount}`, `
      <h2>Deposit Confirmed ✅</h2>
      <p>Hi @${username}, your deposit of <strong>$${amount}</strong> has been added to your 50/50 Life wallet.</p>
      <div class="highlight">Your updated balance is available immediately for betting.</div>
      <a href="${process.env.FRONTEND_URL}/betting" class="btn">Start Betting Now</a>
    `);
  },

  async sendWithdrawalProcessedEmail(email, username, amount, method) {
    await send(email, `Withdrawal of $${amount} is being processed`, `
      <h2>Withdrawal Submitted</h2>
      <p>Hi @${username}, your withdrawal request has been received:</p>
      <div class="highlight">
        <strong>Amount:</strong> $${amount}<br>
        <strong>Method:</strong> ${method}<br>
        <strong>ETA:</strong> 1-3 business days
      </div>
      <p>You'll receive a confirmation email once the transfer is complete.</p>
    `);
  },

  async sendKycApprovedEmail(email, username) {
    await send(email, 'Identity Verified — You can now bet on 50/50 Life!', `
      <h2>You're Verified! 🎉</h2>
      <p>Hi @${username}, your identity has been verified. You now have full access to all betting features on 50/50 Life.</p>
      <a href="${process.env.FRONTEND_URL}/betting" class="btn">Start Betting</a>
    `);
  },

  async sendKycRejectedEmail(email, username, reason) {
    await send(email, 'Identity Verification — Action Required', `
      <h2>Verification Needs Attention</h2>
      <p>Hi @${username}, we were unable to verify your identity. Reason: <strong>${reason}</strong></p>
      <p>Please re-submit your verification documents to access betting features.</p>
      <a href="${process.env.FRONTEND_URL}/settings/kyc" class="btn">Retry Verification</a>
    `);
  },

  async sendWelcomeEmail(email, username) {
    await send(email, 'Welcome to 50/50 Life — Your Arena Awaits', `
      <h2>Welcome to 50/50 Life, @${username}! 🔴🔵</h2>
      <p>Every great bet starts with a 50/50 shot. You're now part of the most exciting social betting platform on the internet.</p>
      <p><strong>Here's how to get started:</strong></p>
      <ol>
        <li><strong>Verify your identity</strong> — required before placing bets</li>
        <li><strong>Deposit funds</strong> — minimum $10 via card, bank, or e-wallet</li>
        <li><strong>Follow people</strong> — see their bets in your feed</li>
        <li><strong>Place your first bet</strong> — pick a side, any side</li>
      </ol>
      <a href="${process.env.FRONTEND_URL}/onboarding" class="btn">Get Started</a>
      <hr class="divider">
      <p style="font-size:12px;color:#888;">You must be 18+ to use 50/50 Life. Gamble responsibly.</p>
    `);
  }
};

module.exports = emailService;
