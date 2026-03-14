const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'ethereal@ethereal.email', pass: 'ethereal_pass' },
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

/**
 * @param {object} order
 * @param {Array}  tickets
 * @param {object} event
 * @param {Buffer} pdfBuffer   - in-memory PDF buffer (from Cloudinary upload step)
 * @param {string} cloudinaryUrl - direct Cloudinary URL for the "View ticket" button
 */
const sendTicketEmail = async (order, tickets, event, pdfBuffer, cloudinaryUrl) => {
  try {
    const transporter = createTransporter();

    const ticketList = tickets.map((t, i) => `
      <tr style="border-bottom: 1px solid #1E293B;">
        <td style="padding: 10px; color: #94A3B8; font-size: 12px;">${i + 1}</td>
        <td style="padding: 10px; color: #F1F5F9; font-size: 12px;">${t.holder.name}</td>
        <td style="padding: 10px; color: #F1F5F9; font-size: 12px;">${t.tierName}</td>
        <td style="padding: 10px; color: #F59E0B; font-size: 12px; font-weight: bold;">${t.ticketId}</td>
      </tr>
    `).join('');

    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    const viewButton = cloudinaryUrl
      ? `<a href="${cloudinaryUrl}" style="display:inline-block;background:#F59E0B;color:#0F172A;font-weight:700;font-size:13px;padding:10px 24px;border-radius:6px;text-decoration:none;margin-top:12px;">View / Download Ticket</a>`
      : '';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Tickets - ${event.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#F59E0B;color:#0F172A;font-size:13px;font-weight:800;letter-spacing:3px;padding:8px 20px;border-radius:2px;">
        TICKETVAULT
      </div>
    </div>

    <div style="background:#1E293B;border-radius:12px;overflow:hidden;border:1px solid #334155;">
      <div style="height:4px;background:linear-gradient(90deg,#F59E0B,#EF4444);"></div>
      <div style="padding:32px;">
        <h1 style="color:#F1F5F9;font-size:24px;font-weight:700;margin:0 0 8px 0;">
          You're going to ${event.name}
        </h1>
        <p style="color:#64748B;font-size:14px;margin:0 0 28px 0;">
          Order ${order.orderId} — ${order.quantity} ticket${order.quantity > 1 ? 's' : ''} confirmed
        </p>

        <div style="background:#0F172A;border-radius:8px;padding:20px;margin-bottom:24px;border:1px solid #1E293B;">
          <div style="margin-bottom:12px;">
            <span style="color:#64748B;font-size:11px;letter-spacing:1px;font-weight:600;display:block;margin-bottom:4px;">DATE</span>
            <span style="color:#F1F5F9;font-size:14px;font-weight:600;">${eventDate}</span>
          </div>
          <div style="margin-bottom:12px;">
            <span style="color:#64748B;font-size:11px;letter-spacing:1px;font-weight:600;display:block;margin-bottom:4px;">TIME</span>
            <span style="color:#F1F5F9;font-size:14px;font-weight:600;">${event.time}</span>
          </div>
          <div>
            <span style="color:#64748B;font-size:11px;letter-spacing:1px;font-weight:600;display:block;margin-bottom:4px;">VENUE</span>
            <span style="color:#F1F5F9;font-size:14px;font-weight:600;">${event.location.venue}, ${event.location.city}</span>
          </div>
        </div>

        <h3 style="color:#94A3B8;font-size:11px;letter-spacing:2px;font-weight:600;margin:0 0 12px 0;">YOUR TICKETS</h3>
        <table style="width:100%;border-collapse:collapse;background:#0F172A;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="border-bottom:1px solid #1E293B;">
              <th style="padding:10px;color:#64748B;font-size:11px;text-align:left;">#</th>
              <th style="padding:10px;color:#64748B;font-size:11px;text-align:left;">ATTENDEE</th>
              <th style="padding:10px;color:#64748B;font-size:11px;text-align:left;">TYPE</th>
              <th style="padding:10px;color:#64748B;font-size:11px;text-align:left;">TICKET ID</th>
            </tr>
          </thead>
          <tbody>${ticketList}</tbody>
        </table>

        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #334155;">
          <span style="color:#64748B;font-size:14px;">Total Paid</span>
          <span style="color:#F59E0B;font-size:18px;font-weight:700;float:right;">R ${order.totalAmount.toFixed(2)}</span>
        </div>

        <div style="text-align:center;">${viewButton}</div>
      </div>
    </div>

    <div style="margin-top:24px;padding:20px;background:#1E293B;border-radius:8px;border:1px solid #334155;">
      <p style="color:#64748B;font-size:12px;margin:0 0 8px 0;font-weight:600;letter-spacing:1px;">ENTRY INSTRUCTIONS</p>
      <p style="color:#94A3B8;font-size:13px;margin:0;line-height:1.6;">
        Your ticket PDF is attached. Present the QR code at the entrance for scanning.
        Each QR code is unique and can only be used once.
        Keep this email as your booking reference.
      </p>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="color:#334155;font-size:12px;margin:0;">TicketVault Platform — Secure Ticketing for Modern Events</p>
    </div>
  </div>
</body>
</html>`;

    const attachments = [];
    if (pdfBuffer) {
      attachments.push({
        filename:    `${event.name.replace(/[^a-z0-9]/gi, '_')}_ticket.pdf`,
        content:     pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    const info = await transporter.sendMail({
      from:    `"TicketVault" <${process.env.SMTP_USER || 'noreply@ticketvault.com'}>`,
      to:      order.buyerDetails.email,
      subject: `Your tickets for ${event.name} — Order ${order.orderId}`,
      html:    htmlContent,
      attachments,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendTicketEmail };