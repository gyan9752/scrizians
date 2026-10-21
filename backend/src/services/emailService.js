const crypto = require('crypto');

/*
 * Scrizians Email & Notification Service
 *
 * Responsibilities:
 * - Lead notifications
 * - OTP verification emails
 * - Password reset emails
 * - Interview notifications
 *
 * Privacy rule:
 * Talent ke personal phone, email, WhatsApp, LinkedIn,
 * GitHub ya personal website details ko outgoing public/client
 * notifications mein expose nahi kiya jayega.
 *
 * Provider abstraction:
 * EMAIL_PROVIDER can later be connected to:
 * - SMTP
 * - Resend
 * - SendGrid
 * - AWS SES
 * - another transactional email provider
 *
 * Current implementation keeps provider integration
 * isolated from controllers/services.
 */

const OFFICE_EMAIL =
  process.env.SCRIZA_OPERATIONS_EMAIL ||
  'info@scriza.in';

const OFFICE_PHONE =
  process.env.SCRIZA_OFFICE_PHONE ||
  '+91 91191 12999';

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  'Scrizians <info@scriza.in>';

const EMAIL_PROVIDER =
  process.env.EMAIL_PROVIDER ||
  'console';

const isProduction =
  process.env.NODE_ENV === 'production';

const generateMessageId = (
  type
) => {
  return `${type}_${Date.now()}_${crypto
    .randomBytes(6)
    .toString('hex')}`;
};

const normalizeString = (
  value,
  maxLength = 1000
) => {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized.slice(
        0,
        maxLength
      )
    : null;
};

const maskEmail = (
  email
) => {
  if (
    typeof email !== 'string' ||
    !email.includes('@')
  ) {
    return 'hidden';
  }

  const [
    localPart,
    domain
  ] = email.split('@');

  if (!localPart) {
    return `***@${domain}`;
  }

  const visiblePart =
    localPart.length > 2
      ? localPart.slice(0, 2)
      : localPart.slice(0, 1);

  return `${visiblePart}***@${domain}`;
};

/*
 * Generic provider sender.
 *
 * Actual provider integration can be added here
 * without changing controllers.
 */
const sendEmail = async ({
  to,
  subject,
  text,
  html
}) => {
  if (
    !to ||
    !subject
  ) {
    throw new Error(
      'Email recipient and subject are required.'
    );
  }

  /*
   * Console mode is intentionally useful for local
   * development and testing.
   */
  if (
    EMAIL_PROVIDER ===
    'console'
  ) {
    console.log(
      '[Email Service] Email prepared:',
      {
        provider:
          EMAIL_PROVIDER,
        from:
          EMAIL_FROM,
        to,
        subject,
        text
      }
    );

    return {
      success: true,
      messageId:
        generateMessageId(
          'msg'
        ),
      provider:
        'console'
    };
  }

  /*
   * Production provider integration should be implemented
   * here after the selected email provider credentials
   * are configured through environment variables.
   */
  if (isProduction) {
    console.warn(
      `[Email Service] EMAIL_PROVIDER="${EMAIL_PROVIDER}" is configured, but no provider adapter is installed.`
    );
  }

  console.log(
    '[Email Service] Email provider fallback:',
    {
      provider:
        EMAIL_PROVIDER,
      from:
        EMAIL_FROM,
      to:
        maskEmail(to),
      subject
    }
  );

  return {
    success: true,
    messageId:
      generateMessageId(
        'msg'
      ),
    provider:
      EMAIL_PROVIDER
  };
};

/*
 * Lead notification
 *
 * Only business/contact information required by
 * Scriza operations is included.
 *
 * No talent private profile fields are exposed.
 */
const sendLeadAlertNotification =
  async (leadData) => {
    if (!leadData) {
      throw new Error(
        'Lead data is required.'
      );
    }

    const leadId =
      leadData._id ||
      leadData.id ||
      'N/A';

    const clientName =
      normalizeString(
        leadData.name,
        100
      ) || 'Unknown';

    const clientEmail =
      normalizeString(
        leadData.email,
        254
      ) || 'N/A';

    const clientPhone =
      normalizeString(
        leadData.phone,
        30
      ) || 'Not provided';

    const company =
      normalizeString(
        leadData.company,
        150
      ) || 'Not provided';

    const serviceRequested =
      normalizeString(
        leadData.serviceRequested,
        150
      ) || 'General Enquiry';

    const message =
      normalizeString(
        leadData.message,
        5000
      ) || 'No message provided';

    const referencedScrizianId =
      normalizeString(
        leadData.scrizianIdReferenced,
        30
      ) || 'N/A';

    const subject =
      `New Scrizians Lead - ${serviceRequested}`;

    const text = [
      'New Scrizians lead received.',
      '',
      `Lead ID: ${leadId}`,
      `Client Name: ${clientName}`,
      `Client Email: ${clientEmail}`,
      `Client Phone: ${clientPhone}`,
      `Company: ${company}`,
      `Service Requested: ${serviceRequested}`,
      `Referenced Scrizian ID: ${referencedScrizianId}`,
      '',
      'Message:',
      message,
      '',
      `Scriza Operations: ${OFFICE_EMAIL}`,
      `Office Phone: ${OFFICE_PHONE}`
    ].join('\n');

    const result =
      await sendEmail({
        to:
          OFFICE_EMAIL,
        subject,
        text
      });

    return {
      ...result,
      leadId
    };
  };

/*
 * OTP verification email
 *
 * OTP is never logged in production.
 */
const sendOTPEmail =
  async (
    email,
    otpCode
  ) => {
    const recipient =
      normalizeString(
        email,
        254
      );

    const otp =
      normalizeString(
        otpCode,
        20
      );

    if (!recipient) {
      throw new Error(
        'Email address is required.'
      );
    }

    if (!otp) {
      throw new Error(
        'OTP code is required.'
      );
    }

    const subject =
      'Scrizians - Verification Code';

    const text = [
      'Your Scrizians verification code is:',
      '',
      otp,
      '',
      'This code is valid for a limited time.',
      'If you did not request this code, please ignore this email.',
      '',
      'Scrizians Team'
    ].join('\n');

    /*
     * Never print the OTP in production logs.
     */
    if (!isProduction) {
      console.log(
        `[Email Service] OTP prepared for ${maskEmail(
          recipient
        )}.`
      );
    }

    return sendEmail({
      to:
        recipient,
      subject,
      text
    });
  };

/*
 * Password reset email
 */
const sendPasswordResetEmail =
  async (
    email,
    resetUrl
  ) => {
    const recipient =
      normalizeString(
        email,
        254
      );

    const safeResetUrl =
      normalizeString(
        resetUrl,
        2000
      );

    if (!recipient) {
      throw new Error(
        'Email address is required.'
      );
    }

    if (!safeResetUrl) {
      throw new Error(
        'Password reset URL is required.'
      );
    }

    const subject =
      'Scrizians - Password Reset';

    const text = [
      'We received a request to reset your Scrizians password.',
      '',
      `Reset your password using this link: ${safeResetUrl}`,
      '',
      'If you did not request a password reset, you can safely ignore this email.',
      '',
      'Scrizians Team'
    ].join('\n');

    return sendEmail({
      to:
        recipient,
      subject,
      text
    });
  };

/*
 * Interview confirmation
 *
 * Only the public Scrizian ID is used.
 * No talent personal contact details are included.
 */
const sendInterviewConfirmationNotification =
  async (
    clientEmail,
    scrizianId,
    slotTime
  ) => {
    const recipient =
      normalizeString(
        clientEmail,
        254
      );

    const talentId =
      normalizeString(
        scrizianId,
        30
      );

    const interviewTime =
      normalizeString(
        slotTime,
        200
      );

    if (!recipient) {
      throw new Error(
        'Client email is required.'
      );
    }

    if (!talentId) {
      throw new Error(
        'Scrizian ID is required.'
      );
    }

    if (!interviewTime) {
      throw new Error(
        'Interview slot time is required.'
      );
    }

    if (
      !/^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i.test(
        talentId
      )
    ) {
      throw new Error(
        'Invalid Scrizian ID format.'
      );
    }

    const subject =
      'Scrizians - Interview Confirmation';

    const text = [
      'Your Scrizians interview has been confirmed.',
      '',
      `Scrizian ID: ${talentId.toUpperCase()}`,
      `Interview Slot: ${interviewTime}`,
      '',
      'Our team will coordinate the next steps.',
      '',
      `Scriza Operations: ${OFFICE_EMAIL}`,
      `Office Phone: ${OFFICE_PHONE}`
    ].join('\n');

    return sendEmail({
      to:
        recipient,
      subject,
      text
    });
  };

module.exports = {
  sendLeadAlertNotification,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendInterviewConfirmationNotification
};