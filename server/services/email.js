import nodemailer from "nodemailer";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
})[character]);

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !MAIL_FROM) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and MAIL_FROM.");
  }

  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port.");
  }

  return {
    from: MAIL_FROM,
    transporter: nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    }),
  };
}

export async function sendPatientWelcome({ to, patientName }) {
  const { from, transporter } = createTransporter();
  const safeName = escapeHtml(patientName);

  await transporter.sendMail({
    from,
    to,
    subject: "Welcome to QueueCare",
    text: `Hello ${patientName}, your QueueCare patient account is ready. Sign in to browse clinicians, book appointments, and track your care.`,
    html: `<div style="font-family:Arial,sans-serif;color:#31434a;line-height:1.6"><h2 style="color:#28775a">Welcome to QueueCare</h2><p>Hello ${safeName},</p><p>Your patient account is ready. You can now browse clinicians, book appointments, and track your visit and queue from the QueueCare patient portal.</p></div>`,
  });
}

export async function sendAppointmentConfirmation({ to, patientName, doctorName, date, time, type, tokenNumber }) {
  const { from, transporter } = createTransporter();
  const appointmentDate = new Date(date);
  const formattedDate = appointmentDate.toLocaleDateString("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const safeName = escapeHtml(patientName);
  const safeDoctor = escapeHtml(doctorName);
  const safeType = escapeHtml(type);
  const formattedTime = new Date(`2000-01-01T${time}:00`).toLocaleTimeString("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
  await transporter.sendMail({
    from,
    to,
    subject: "Your QueueCare appointment is confirmed",
    text: `Hello ${patientName}, your ${type} appointment with Dr. ${doctorName} is confirmed for ${formattedDate} at ${formattedTime}. Your queue token is #${tokenNumber}.`,
    html: `<div style="font-family:Arial,sans-serif;color:#31434a;line-height:1.6"><h2 style="color:#28775a">Your appointment is confirmed</h2><p>Hello ${safeName},</p><p>Your QueueCare appointment details:</p><ul><li><b>Clinician:</b> Dr. ${safeDoctor}</li><li><b>Visit:</b> ${safeType}</li><li><b>Date:</b> ${formattedDate}</li><li><b>Time:</b> ${formattedTime}</li><li><b>Queue token:</b> #${tokenNumber}</li></ul><p>You can view appointment updates in your QueueCare patient portal.</p></div>`,
  });
}
