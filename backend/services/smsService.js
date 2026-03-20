/**
 * SMS Service — 50/50 Life
 * Handles phone verification and OTP messages via Twilio
 */

const logger = require('../config/logger');

class SmsService {

  async sendVerificationCode(phone, code) {
    try {
      // Twilio integration — add TWILIO keys to env to enable
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await client.messages.create({
          body: 'Your 50/50 Life verification code is: ' + code,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        logger.info('SMS sent to ' + phone);
      } else {
        // Log code in development when Twilio not configured
        logger.info('SMS verification code for ' + phone + ': ' + code);
      }
    } catch (err) {
      logger.error('SMS send failed:', err.message);
    }
  }

  async sendLoginAlert(phone, location) {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await client.messages.create({
          body: 'New login to your 50/50 Life account from ' + (location || 'unknown location') + '. Not you? Contact support immediately.',
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
      }
    } catch (err) {
      logger.error('SMS alert failed:', err.message);
    }
  }

  async sendBetNotification(phone, message) {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        await client.messages.create({
          body: '50/50 Life: ' + message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
      }
    } catch (err) {
      logger.error('SMS notification failed:', err.message);
    }
  }
}

module.exports = new SmsService();
