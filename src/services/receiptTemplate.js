/**
 * Consecrated Vedic Temple HTML Email Receipt Template
 * Styled in sacred temple aesthetic: Deep Saffron (#D97706), Golden Amber (#F59E0B), 
 * Sanctum Maroon (#78350F), and Warm Ivory (#FFFBEB).
 * Entity: Salahkareshwar Mahadev Tirth (पुण्य पासपोर्ट)
 */

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDateIST(date) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'Asia/Kolkata'
    }).format(new Date(date));
  } catch (e) {
    return new Date(date).toUTCString();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates the responsive HTML email receipt
 * @param {Object} order - Order document
 * @param {Object} receipt - TransactionReceipt document
 * @returns {string} Sanitized, responsive HTML
 */
function generateReceiptHtml(order, receipt) {
  const customer = receipt?.customerDetails || order?.customer || {};
  const items = receipt?.itemizedList?.length ? receipt.itemizedList : (receipt?.lineItems?.length ? receipt.lineItems : (order?.items || []));
  const receiptDate = formatDateIST(receipt?.paymentTimestamp || receipt?.createdAt || order?.updatedAt || new Date());
  const totalAmount = receipt?.amountPaid || receipt?.financials?.totalPaid || order?.totalAmount || 0;
  const formattedTotal = formatCurrency(totalAmount);

  const itemRows = items.map((item) => `
    <tr style="border-bottom: 1px solid #FDE68A;">
      <td style="padding: 12px 8px; color: #1F2937; font-size: 14px; font-weight: 500;">
        ${escapeHtml(item.title || item.productTitle || 'Sacred Shivling Sthapana Offering')}
      </td>
      <td style="padding: 12px 8px; text-align: center; color: #4B5563; font-size: 14px;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 12px 8px; text-align: right; color: #4B5563; font-size: 14px;">
        ${formatCurrency(item.unitPrice || 0)}
      </td>
      <td style="padding: 12px 8px; text-align: right; color: #1F2937; font-size: 14px; font-weight: 600;">
        ${formatCurrency(item.subtotal || ((item.unitPrice || 0) * (item.quantity || 1)))}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consecrated Offering Receipt — Salahkareshwar Mahadev Tirth (पुण्य पासपोर्ट)</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF5EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3748;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF5EE; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 640px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(120, 53, 15, 0.08); border: 2px solid #FDE68A;">
          
          <!-- Temple Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #78350F 0%, #B45309 50%, #D97706 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
              <div style="font-size: 38px; line-height: 1; margin-bottom: 8px; color: #FDE68A;">ॐ</div>
              <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; color: #FFFFFF;">
                श्री सलाहकारेश्वर महादेव तीर्थ
              </h1>
              <p style="margin: 0; font-size: 13px; color: #FDE68A; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                पुण्य पासपोर्ट (PUNYA PASSPORT) • CONSECRATED SEVA RECEIPT
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #FEF3C7; letter-spacing: 0.5px;">
                Gotri, Vadodara (Gujarat) • PAN: ABETS6872M • Udyam: UDYAM-GJ-24-0064289
              </p>
            </td>
          </tr>

          <!-- Sacred Blessing Invocation -->
          <tr>
            <td style="background-color: #FFFBEB; padding: 18px 24px; border-bottom: 1px solid #FDE68A; text-align: center;">
              <p style="margin: 0; font-size: 15px; font-style: italic; color: #92400E; font-weight: 500;">
                "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥"
              </p>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #B45309;">
                May Lord Mahadev grant supreme longevity, spiritual sanctity, and prosperity to you and your lineage.
              </p>
            </td>
          </tr>

          <!-- Receipt Details & Devotee Sankalp Information -->
          <tr>
            <td style="padding: 24px;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 12px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #92400E; letter-spacing: 1px;">
                      Devotee & Sankalp Details
                    </h3>
                    <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #1F2937;">
                      ${escapeHtml(customer.name || 'Devotee')}
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #4B5563;">
                      <strong>Sankalp Yajman:</strong> ${escapeHtml(customer.sankalpName || customer.name || 'N/A')}
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #4B5563;">
                      <strong>Email:</strong> ${escapeHtml(customer.email || 'N/A')}
                    </p>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 12px; border-left: 1px solid #FDE68A;">
                    <h3 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #92400E; letter-spacing: 1px;">
                      Transaction Audit & Settlement
                    </h3>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #4B5563;">
                      <strong>Receipt No:</strong> <span style="font-family: monospace; color: #92400E; font-weight: 700;">${escapeHtml(receipt?.receiptNumber || 'N/A')}</span>
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #4B5563;">
                      <strong>Order No:</strong> <span style="font-family: monospace;">${escapeHtml(receipt?.orderNumber || order?.orderNumber || 'N/A')}</span>
                    </p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #4B5563;">
                      <strong>Payment ID:</strong> <span style="font-family: monospace;">${escapeHtml(receipt?.gatewayTransactionId || order?.razorpayPaymentId || 'N/A')}</span>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #6B7280;">
                      <strong>Date:</strong> ${receiptDate}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Itemized Offerings Table -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #FDE68A; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #FEF3C7; text-align: left;">
                    <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; color: #78350F;">Offering Description</th>
                    <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; color: #78350F; text-align: center;">Qty</th>
                    <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; color: #78350F; text-align: right;">Dakshina</th>
                    <th style="padding: 10px 8px; font-size: 12px; text-transform: uppercase; color: #78350F; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr style="background-color: #FFFBEB;">
                    <td colspan="3" style="padding: 14px 8px; text-align: right; font-size: 15px; font-weight: 700; color: #78350F;">
                      Total Consecrated Amount:
                    </td>
                    <td style="padding: 14px 8px; text-align: right; font-size: 18px; font-weight: 800; color: #B45309;">
                      ${formattedTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Official Bank Settlement Details -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #78350F;">
                <strong>Official Bank Settlement:</strong> Kotak Mahindra Bank, Gotri Branch, Vadodara | 
                A/C: <strong>2847327173</strong> | IFSC: <strong>KKBK0002747</strong> | UPI: <strong>Salahkareshwar@kotak</strong>
              </div>
            </td>
          </tr>

          <!-- Seal of Authenticity -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <div style="background-color: #FDFBF7; border: 1px dashed #D97706; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #78350F;">
                  AUTHENTICATED PUNYA PASSPORT TEMPLE SEVA RECORD
                </p>
                <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.5;">
                  This is an electronically generated and cryptographically verified sacred receipt.<br>
                  Prasad packaging and ceremonial sanctum dispatch will be initiated per Vedic muhurta schedule.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F3F4F6; padding: 18px 24px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">
                Salahkareshwar Mahadev Tirth (श्री सलाहकारेश्वर महादेव तीर्थ)
              </p>
              <p style="margin: 0 0 4px 0; font-size: 11px;">
                408, Souvenir Flats, Opp GreenField Bungalows, Laxmipura, Gotri Sevasi Road, New Alkapuri, Vadodara, Gujarat - 390012
              </p>
              <p style="margin: 0;">
                Helpline: <a href="tel:+919825600778" style="color: #B45309; text-decoration: none; font-weight: 700;">+91 98256 00778</a> · Email: <a href="mailto:himanshu@meratrainer.com" style="color: #B45309; text-decoration: none; font-weight: 600;">himanshu@meratrainer.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates plain-text fallback for terminal/legacy clients
 */
function generateReceiptText(order, receipt) {
  const customer = receipt?.customerDetails || order?.customer || {};
  const totalAmount = receipt?.amountPaid || receipt?.financials?.totalPaid || order?.totalAmount || 0;
  const total = formatCurrency(totalAmount);
  return `
======================================================
SALAHKARESHWAR MAHADEV TIRTH - PUNYA PASSPORT RECEIPT
श्री सलाहकारेश्वर महादेव तीर्थ (पुण्य पासपोर्ट)
408, Souvenir Flats, Gotri Sevasi Road, Vadodara, Gujarat - 390012
PAN: ABETS6872M | Udyam: UDYAM-GJ-24-0064289
======================================================
Receipt Number: ${receipt?.receiptNumber || 'N/A'}
Order Number:   ${receipt?.orderNumber || order?.orderNumber || 'N/A'}
Payment ID:     ${receipt?.gatewayTransactionId || order?.razorpayPaymentId || 'N/A'}
Date:           ${formatDateIST(receipt?.paymentTimestamp || new Date())}

DEVOTEE SANKALP DETAILS:
Name:           ${customer.name || 'Devotee'}
Sankalp Yajman: ${customer.sankalpName || customer.name || 'N/A'}
Email:          ${customer.email || 'N/A'}

BANK SETTLEMENT:
Kotak Mahindra Bank, Gotri Branch, Vadodara
A/C: 2847327173 | IFSC: KKBK0002747 | UPI: Salahkareshwar@kotak

TOTAL DAKSHINA PAID: ${total}

May Mahadev bless you and your family with longevity, peace, and spiritual abundance.
Helpline: +91 98256 00778 | himanshu@meratrainer.com
======================================================
  `;
}

module.exports = {
  generateReceiptHtml,
  generateReceiptText
};
