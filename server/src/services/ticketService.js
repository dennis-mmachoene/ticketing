const PDFDocument = require('pdfkit');
const { generateQRBuffer } = require('./qrService');
const { uploadTicketPDF } = require('./cloudinaryService');

const TICKET_WIDTH  = 600;
const TICKET_HEIGHT = 300;

/**
 * Render the ticket PDF into an in-memory buffer, then upload to Cloudinary.
 * Returns { cloudinaryUrl, publicId, buffer }
 * buffer is kept so emailService can attach it without re-downloading.
 */
const generateTicketPDF = (ticket, event, aiDesign = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const primaryColor = aiDesign?.colorPalette?.[0] || '#0F172A';
      const accentColor  = aiDesign?.colorPalette?.[1] || '#F59E0B';
      const textColor    = '#FFFFFF';
      const mutedColor   = '#94A3B8';

      const doc = new PDFDocument({
        size:   [TICKET_WIDTH, TICKET_HEIGHT],
        margin: 0,
        info: {
          Title:   `${event.name} - Ticket`,
          Author:  'TicketVault',
          Subject: 'Event Ticket',
        },
      });

      // Collect output into a buffer instead of writing to disk
      const chunks = [];
      doc.on('data',  (chunk) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end',   async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const { url, public_id } = await uploadTicketPDF(buffer, ticket.ticketId);
          resolve({ cloudinaryUrl: url, publicId: public_id, buffer });
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });

      // ─── Background ───────────────────────────────────────────────
      doc.rect(0, 0, TICKET_WIDTH, TICKET_HEIGHT).fill(primaryColor);
      doc.rect(0, 0, 6, TICKET_HEIGHT).fill(accentColor);

      const stubX = TICKET_WIDTH - 180;
      doc.rect(stubX, 0, 180, TICKET_HEIGHT).fill('#1E293B');

      doc.save();
      doc.dash(4, { space: 4 });
      doc.moveTo(stubX, 20).lineTo(stubX, TICKET_HEIGHT - 20).stroke('#334155');
      doc.undash();
      doc.restore();

      doc.circle(stubX, 0,             10).fill(primaryColor);
      doc.circle(stubX, TICKET_HEIGHT, 10).fill(primaryColor);

      // ─── Left Section ─────────────────────────────────────────────
      const leftPad = 28;
      let y = 28;

      doc.fontSize(9).fillColor(accentColor).font('Helvetica-Bold')
        .text('EVENT TICKET', leftPad, y, { characterSpacing: 2 });
      y += 18;

      const eventName = event.name.length > 40
        ? event.name.substring(0, 40) + '...'
        : event.name;
      doc.fontSize(20).fillColor(textColor).font('Helvetica-Bold')
        .text(eventName, leftPad, y, { width: stubX - leftPad - 20 });
      y += doc.currentLineHeight() + 6;

      doc.moveTo(leftPad, y).lineTo(stubX - 20, y).lineWidth(0.5).stroke('#334155');
      y += 12;

      const col1X = leftPad;
      const col2X = leftPad + 160;

      const drawInfo = (label, value, x, startY, maxWidth = 140) => {
        doc.fontSize(7).fillColor(mutedColor).font('Helvetica')
          .text(label.toUpperCase(), x, startY, { characterSpacing: 1 });
        doc.fontSize(10).fillColor(textColor).font('Helvetica-Bold')
          .text(value || 'N/A', x, startY + 10, { width: maxWidth });
      };

      const dateStr = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      });

      drawInfo('DATE',        dateStr,              col1X, y);
      drawInfo('TIME',        event.time,           col2X, y);
      y += 42;

      drawInfo('VENUE',       event.location.venue, col1X, y, 150);
      drawInfo('TICKET TYPE', ticket.tierName,      col2X, y);
      y += 42;

      drawInfo('ATTENDEE', ticket.holder.name, col1X, y, 300);

      doc.fontSize(8).fillColor(mutedColor).font('Helvetica')
        .text(`Ticket ID: ${ticket.ticketId}`, leftPad, TICKET_HEIGHT - 24);

      // ─── Right Section (QR Stub) ──────────────────────────────────
      const qrBuffer = await generateQRBuffer(ticket.validationToken);
      const qrSize   = 120;
      const qrX      = stubX + (180 - qrSize) / 2;
      const qrY      = (TICKET_HEIGHT - qrSize - 30) / 2;

      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      doc.fontSize(7).fillColor(mutedColor).font('Helvetica')
        .text('SCAN TO ENTER', stubX, qrY + qrSize + 6, {
          width: 180, align: 'center', characterSpacing: 1.5,
        });

      doc.fontSize(6).fillColor(mutedColor).font('Helvetica')
        .text('Present this ticket at the entrance', stubX, TICKET_HEIGHT - 20, {
          width: 180, align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateTicketPDF };