/**
 * Cinema Ticket HTML Email Generator for QuickShow
 */

function formatDuration(minutes) {
  if (!minutes || isNaN(minutes)) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function generateBookingTicketEmail({ booking, user, movie, show }) {
  const bookingId = booking._id?.toString() || String(booking.id || '');
  const userName = user?.name || 'Movie Lover';
  const movieTitle = movie?.title || 'Selected Movie';
  const posterUrl = movie?.poster_path
    ? (movie.poster_path.startsWith('http')
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';

  const showDateTime = show?.showDateTime ? new Date(show.showDateTime) : new Date();
  
  // Format dates for display (Indian Standard Time Asia/Kolkata by default)
  const dateFormatted = showDateTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const timeFormatted = showDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const seats = Array.isArray(booking?.bookedSeats) ? booking.bookedSeats : [];
  const seatsList = seats.join(', ') || 'General Admission';
  const seatBadges = seats.map(s => 
    `<span style="display:inline-block;background:#E11D48;color:#FFFFFF;padding:4px 10px;margin:2px 4px 2px 0;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:0.5px;">${s}</span>`
  ).join('');

  const unitPrice = show?.showPrice != null ? Number(show.showPrice) : (seats.length ? Math.round(booking.amount / seats.length) : booking.amount);
  const totalAmount = Number(booking.amount || 0);
  const currencySymbol = process.env.CURRENCY_SYMBOL || '$';
  const runtimeFormatted = formatDuration(movie?.runtime);
  const genres = Array.isArray(movie?.genres) 
    ? movie.genres.map(g => (typeof g === 'object' ? g.name : g)).join(' • ')
    : '';

  const subject = `🎬 Booking Confirmed! "${movieTitle}" [Booking ID: ${bookingId}]`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#090D16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#090D16;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width:540px;background:#131B2E;border:1px solid #1E293B;border-radius:18px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);" cellpadding="0" cellspacing="0">
          
          <!-- Brand Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #E11D48 0%, #BE123C 100%);padding:22px 28px;text-align:left;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:900;letter-spacing:2px;color:#FFFFFF;text-transform:uppercase;">QUICKSHOW</span>
                    <div style="font-size:11px;color:#FFE4E6;letter-spacing:1px;text-transform:uppercase;margin-top:2px;">E-Ticket & Booking Confirmation</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(255,255,255,0.2);color:#FFFFFF;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.3);">
                      ✓ PAID
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:24px 28px 12px 28px;">
              <h2 style="margin:0 0 6px 0;font-size:18px;font-weight:700;color:#F8FAFC;">Hi ${userName},</h2>
              <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.5;">Your payment was successful and your movie tickets are locked in! Get ready for the big screen.</p>
            </td>
          </tr>

          <!-- Movie Card Hero -->
          <tr>
            <td style="padding:12px 28px;">
              <table role="presentation" width="100%" style="background:#0F172A;border-radius:12px;border:1px solid #1E293B;overflow:hidden;" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="110" style="vertical-align:top;padding:0;">
                    <img src="${posterUrl}" alt="${movieTitle}" width="110" height="155" style="display:block;object-fit:cover;border-top-left-radius:12px;border-bottom-left-radius:12px;width:110px;height:155px;" />
                  </td>
                  <td style="padding:16px 18px;vertical-align:middle;">
                    <span style="font-size:11px;font-weight:700;color:#F43F5E;text-transform:uppercase;letter-spacing:1px;">Movie</span>
                    <h3 style="margin:4px 0 6px 0;font-size:18px;font-weight:800;color:#FFFFFF;line-height:1.25;">${movieTitle}</h3>
                    ${genres ? `<div style="font-size:12px;color:#94A3B8;margin-bottom:4px;">${genres}</div>` : ''}
                    ${runtimeFormatted ? `<div style="font-size:11px;color:#64748B;">⏱ ${runtimeFormatted}</div>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ticket Perforation Divider -->
          <tr>
            <td style="padding:8px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-bottom:2px dashed #334155;height:1px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Show & Seat Details Grid -->
          <tr>
            <td style="padding:16px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Date & Time -->
                  <td width="50%" style="vertical-align:top;padding-right:12px;">
                    <div style="font-size:11px;color:#64748B;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;">Show Date</div>
                    <div style="font-size:14px;color:#F1F5F9;font-weight:700;margin-top:4px;">${dateFormatted}</div>
                    
                    <div style="font-size:11px;color:#64748B;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin-top:14px;">Show Time</div>
                    <div style="font-size:15px;color:#F43F5E;font-weight:800;margin-top:4px;">${timeFormatted}</div>
                  </td>

                  <!-- Booking ID & Seats -->
                  <td width="50%" style="vertical-align:top;padding-left:12px;">
                    <div style="font-size:11px;color:#64748B;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;">Booking ID</div>
                    <div style="font-size:13px;color:#F1F5F9;font-weight:700;margin-top:4px;font-family:monospace;background:#1E293B;padding:3px 8px;border-radius:6px;display:inline-block;letter-spacing:0.5px;">
                      ${bookingId}
                    </div>

                    <div style="font-size:11px;color:#64748B;text-transform:uppercase;font-weight:700;letter-spacing:0.8px;margin-top:14px;">
                      Seats (${seats.length})
                    </div>
                    <div style="margin-top:6px;">
                      ${seatBadges || '<span style="color:#F1F5F9;font-size:13px;">Confirmed</span>'}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Summary Box -->
          <tr>
            <td style="padding:8px 28px 20px 28px;">
              <table role="presentation" width="100%" style="background:#0F172A;border-radius:12px;border:1px solid #1E293B;padding:16px 18px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td colspan="2" style="padding-bottom:10px;border-bottom:1px solid #1E293B;">
                    <span style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.8px;">Transaction Summary</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0 4px 0;font-size:13px;color:#94A3B8;">
                    ${seats.length} x Ticket (${currencySymbol}${unitPrice} each)
                  </td>
                  <td align="right" style="padding:10px 0 4px 0;font-size:13px;color:#E2E8F0;font-weight:600;">
                    ${currencySymbol}${totalAmount}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0 10px 0;font-size:13px;color:#94A3B8;">
                    Payment Method
                  </td>
                  <td align="right" style="padding:4px 0 10px 0;font-size:12px;color:#38BDF8;font-weight:600;">
                    Stripe (Online)
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:10px;border-top:1px solid #1E293B;font-size:15px;font-weight:800;color:#FFFFFF;">
                    Total Paid
                  </td>
                  <td align="right" style="padding-top:10px;border-top:1px solid #1E293B;font-size:18px;font-weight:900;color:#10B981;">
                    ${currencySymbol}${totalAmount}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Note / Instructions -->
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" style="background:rgba(244,63,94,0.08);border-left:3px solid #F43F5E;border-radius:4px;padding:12px 14px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#CBD5E1;line-height:1.5;">
                    💡 <strong>Entry Instructions:</strong> Please arrive at the cinema 15 minutes before showtime. Show this digital confirmation or Booking ID <strong>${bookingId}</strong> at the cinema counter to collect your physical pass or scan at the entry gate.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;border-top:1px solid #1E293B;padding:20px 28px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#64748B;">
                Need help with your booking? Contact us at support@quickshow.com
              </p>
              <p style="margin:0;font-size:11px;color:#475569;">
                © ${new Date().getFullYear()} QuickShow Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `QUICKSHOW BOOKING CONFIRMATION
========================================
Hi ${userName},

Your booking is confirmed! Here are your ticket details:

Movie: ${movieTitle}
Booking ID: ${bookingId}
Date: ${dateFormatted}
Time: ${timeFormatted}
Seats (${seats.length}): ${seatsList}
Total Paid: ${currencySymbol}${totalAmount} (via Stripe)

Entry Instructions:
Please arrive 15 minutes prior to the show. Present this email or Booking ID at the cinema counter.

Thank you for booking with QuickShow!
Support: support@quickshow.com
`;

  return { subject, html, text };
}

export function generateShowCancellationRefundEmail({ booking, user, movie, show }) {
  const bookingId = booking._id?.toString() || String(booking.id || '');
  const userName = user?.name || 'Movie Lover';
  const movieTitle = movie?.title || 'Your Selected Movie';
  const posterUrl = movie?.poster_path
    ? (movie.poster_path.startsWith('http')
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';

  const showDateTime = show?.showDateTime ? new Date(show.showDateTime) : new Date();

  const dateFormatted = showDateTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const timeFormatted = showDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const seats = Array.isArray(booking?.bookedSeats) ? booking.bookedSeats : [];
  const seatsList = seats.join(', ') || 'N/A';
  const seatBadges = seats.map(s => 
    `<span style="display:inline-block;background:#334155;color:#E2E8F0;padding:4px 10px;margin:2px 4px 2px 0;border-radius:6px;font-size:12px;font-weight:700;">${s}</span>`
  ).join('');

  const totalAmount = Number(booking.amount || 0);
  const currencySymbol = process.env.CURRENCY_SYMBOL || '$';
  const refundUrl = `https://quickshow-refunds.vercel.app/refund?bookingId=${bookingId}&amount=${totalAmount}`;

  const subject = `⚠️ Show Cancelled & Full Refund Notice: "${movieTitle}" [Booking ID: ${bookingId}]`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#090D16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#E2E8F0;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#090D16;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width:540px;background:#131B2E;border:1px solid #1E293B;border-radius:18px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);" cellpadding="0" cellspacing="0">
          
          <!-- Alert Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #DC2626 0%, #991B1B 100%);padding:22px 28px;text-align:left;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:900;letter-spacing:2px;color:#FFFFFF;text-transform:uppercase;">QUICKSHOW</span>
                    <div style="font-size:11px;color:#FEE2E2;letter-spacing:1px;text-transform:uppercase;margin-top:2px;">Important Screening Notice</div>
                  </td>
                  <td align="right">
                    <span style="background:rgba(255,255,255,0.2);color:#FFFFFF;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.3);">
                      CANCELLED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding:24px 28px 12px 28px;">
              <h2 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#F8FAFC;">Hi ${userName},</h2>
              <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.6;">
                We regret to inform you that your upcoming movie screening for <strong style="color:#F1F5F9;">"${movieTitle}"</strong> has been cancelled by cinema management due to schedule changes.
              </p>
              <p style="margin:12px 0 0 0;font-size:14px;color:#94A3B8;line-height:1.6;">
                We sincerely apologize for the inconvenience. A <strong style="color:#22C55E;">100% full refund of ${currencySymbol}${totalAmount}</strong> is guaranteed for your booking.
              </p>
            </td>
          </tr>

          <!-- Cancelled Show Summary -->
          <tr>
            <td style="padding:12px 28px 20px 28px;">
              <table role="presentation" width="100%" style="background:#0F172A;border:1px solid #1E293B;border-radius:12px;overflow:hidden;" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="110" style="padding:0;vertical-align:top;">
                    <img src="${posterUrl}" alt="${movieTitle}" width="110" height="150" style="display:block;width:110px;height:150px;object-fit:cover;" />
                  </td>
                  <td style="padding:16px 18px;vertical-align:middle;">
                    <h3 style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#FFFFFF;line-height:1.3;">${movieTitle}</h3>
                    <div style="font-size:12px;color:#94A3B8;margin-bottom:8px;">Booking ID: <strong style="color:#CBD5E1;">${bookingId}</strong></div>
                    <div style="font-size:12px;color:#94A3B8;margin-bottom:4px;">Date: <strong style="color:#CBD5E1;">${dateFormatted}</strong></div>
                    <div style="font-size:12px;color:#94A3B8;margin-bottom:8px;">Time: <strong style="color:#CBD5E1;">${timeFormatted}</strong></div>
                    <div style="font-size:12px;color:#94A3B8;">Seats: ${seatBadges}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Refund Card & CTA Button -->
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" style="background:#1E293B;border:1px solid #334155;border-radius:12px;padding:20px;text-align:center;" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Refund Amount</div>
                    <div style="font-size:28px;font-weight:800;color:#22C55E;margin:6px 0 12px 0;">${currencySymbol}${totalAmount}</div>
                    <p style="margin:0 0 16px 0;font-size:13px;color:#CBD5E1;line-height:1.5;">
                      Please click the link below to verify your details and initiate your refund process:
                    </p>
                    <a href="${refundUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, #E11D48 0%, #BE123C 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:30px;box-shadow:0 4px 12px rgba(225,29,72,0.4);letter-spacing:0.5px;">
                      Claim / Initiate Refund &rarr;
                    </a>
                    <div style="margin-top:14px;font-size:11px;color:#64748B;">
                      Refund Portal Link: <br/>
                      <a href="${refundUrl}" style="color:#F43F5E;word-break:break-all;">${refundUrl}</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;border-top:1px solid #1E293B;padding:20px 28px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#64748B;">
                Questions or issues? Contact our support team at support@quickshow.com
              </p>
              <p style="margin:0;font-size:11px;color:#475569;">
                © ${new Date().getFullYear()} QuickShow Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `QUICKSHOW - SHOW CANCELLED & REFUND NOTICE
==================================================
Hi ${userName},

We regret to inform you that your movie screening for "${movieTitle}" has been cancelled by cinema management.
We apologize for the inconvenience. A full refund of ${currencySymbol}${totalAmount} is guaranteed.

Booking Details:
- Movie: ${movieTitle}
- Booking ID: ${bookingId}
- Date: ${dateFormatted}
- Time: ${timeFormatted}
- Seats (${seats.length}): ${seatsList}
- Refund Amount: ${currencySymbol}${totalAmount}

To claim or initiate your refund, please use the following link:
${refundUrl}

If you have questions, please contact our support team at support@quickshow.com.
`;

  return { subject, html, text };
}
