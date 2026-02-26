/**
 * Email template: Conferma Ordine
 *
 * Variables (replaced at runtime):
 *   {{ORDER_ID}}         - ID ordine
 *   {{USER_NAME}}        - Nome utente
 *   {{ORDER_ITEMS_HTML}} - Righe articoli (pre-renderizzate)
 *   {{SUBTOTAL}}         - Subtotale articoli
 *   {{SHIPPING_COST}}    - Costo spedizione
 *   {{TOTAL}}            - Totale pagato
 *   {{SHIPPING_ADDRESS}} - Indirizzo di spedizione (pre-renderizzato)
 *   {{ORDER_DATE}}       - Data ordine
 *   {{SITE_URL}}         - URL del sito
 */
export const orderConfirmationHtml = `
<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Ordine Confermato - Birillo Pet Shop</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
    body, table, td { font-family: 'Quicksand', Arial, Helvetica, sans-serif; }
    @media only screen and (max-width: 600px) {
      .outer-table { width: 100% !important; }
      .inner-pad { padding: 28px 20px !important; }
      .header-pad { padding: 24px 20px !important; }
      .footer-pad { padding: 28px 20px !important; }
      .cta-btn { padding: 14px 28px !important; font-size: 15px !important; }
      .title { font-size: 22px !important; }
      .subtitle { font-size: 14px !important; }
      .item-img { width: 48px !important; height: 48px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4; padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Main container -->
        <table role="presentation" class="outer-table" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td class="header-pad" align="center" style="padding:32px 40px 24px; background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%); border-radius:16px 16px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="https://res.cloudinary.com/dayxi0enk/image/upload/v1772037564/email/birillo-logo.png" alt="Birillo Pet Shop" width="56" height="56" style="width:56px; height:56px; border-radius:50%; display:block; box-shadow:0 2px 8px rgba(0,143,76,0.1);" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-size:22px; font-weight:800; color:#008F4C; letter-spacing:1px;">BIRILLO</span>
                    <br/>
                    <span style="font-size:11px; font-weight:600; color:#78716c; letter-spacing:2px; text-transform:uppercase;">Pet Shop &middot; Teramo</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="inner-pad" style="background-color:#ffffff; padding:40px 44px; border-left:1px solid #e7e5e4; border-right:1px solid #e7e5e4;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Success Icon -->
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <div style="width:64px; height:64px; border-radius:50%; background-color:#f0fdf4; border:2px solid #86efac; display:inline-block; text-align:center; line-height:64px;">
                      <img src="https://res.cloudinary.com/dayxi0enk/image/upload/v1772037565/email/icon-checkmark.svg" alt="" width="32" height="32" style="width:32px; height:32px; vertical-align:middle;" />
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <h1 class="title" style="margin:0; font-size:24px; font-weight:700; color:#1c1917; line-height:1.3;">
                      Ordine Confermato!
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <p class="subtitle" style="margin:0; font-size:15px; color:#78716c; line-height:1.6;">
                      Grazie {{USER_NAME}}! Il tuo ordine <strong style="color:#008F4C;">#{{ORDER_ID}}</strong> è stato ricevuto e confermato.
                    </p>
                  </td>
                </tr>

                <!-- Order badge -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:12px 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:16px; border-right:1px solid #bbf7d0;">
                                <span style="font-size:11px; color:#78716c; text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">Ordine</span>
                                <br/>
                                <span style="font-size:16px; font-weight:700; color:#008F4C;">#{{ORDER_ID}}</span>
                              </td>
                              <td style="padding-left:16px;">
                                <span style="font-size:11px; color:#78716c; text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">Data</span>
                                <br/>
                                <span style="font-size:14px; font-weight:600; color:#44403c;">{{ORDER_DATE}}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items section -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f5f5f4; border-radius:12px; overflow:hidden;">
                      <!-- Items header -->
                      <tr>
                        <td style="background-color:#fafaf9; padding:10px 16px; border-bottom:1px solid #f5f5f4;">
                          <span style="font-size:12px; font-weight:700; color:#78716c; text-transform:uppercase; letter-spacing:0.5px;">I tuoi articoli</span>
                        </td>
                      </tr>
                      <!-- Dynamic items -->
                      <tr>
                        <td style="padding:0;">
                          {{ORDER_ITEMS_HTML}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Totals -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafaf9; border-radius:12px; padding:16px;">
                      <tr>
                        <td style="padding:12px 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:14px; color:#78716c; padding-bottom:8px;">Subtotale</td>
                              <td align="right" style="font-size:14px; color:#44403c; font-weight:600; padding-bottom:8px;">{{SUBTOTAL}}</td>
                            </tr>
                            <tr>
                              <td style="font-size:14px; color:#78716c; padding-bottom:12px;">Spedizione</td>
                              <td align="right" style="font-size:14px; color:#44403c; font-weight:600; padding-bottom:12px;">{{SHIPPING_COST}}</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="border-top:1px solid #e7e5e4; padding-top:12px;"></td>
                            </tr>
                            <tr>
                              <td style="font-size:16px; color:#1c1917; font-weight:700;">Totale</td>
                              <td align="right" style="font-size:20px; color:#008F4C; font-weight:700;">{{TOTAL}}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Shipping address -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:8px;">
                          <span style="font-size:12px; font-weight:700; color:#78716c; text-transform:uppercase; letter-spacing:0.5px;">Indirizzo di spedizione</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color:#fafaf9; border-radius:10px; padding:14px 16px; font-size:14px; color:#44403c; line-height:1.6;">
                          {{SHIPPING_ADDRESS}}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- What happens next -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb; border:1px solid #fde68a; border-radius:12px;">
                      <tr>
                        <td style="padding:16px;">
                          <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#92400e;">Cosa succede ora?</p>
                          <p style="margin:0; font-size:13px; color:#a16207; line-height:1.6;">
                            Stiamo preparando il tuo ordine con cura. Riceverai un'email quando il pacco sarà spedito. Puoi controllare lo stato in qualsiasi momento dal tuo account.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius:50px; background-color:#008F4C; box-shadow:0 4px 14px rgba(0,143,76,0.25);">
                          <a href="{{SITE_URL}}/#/account" target="_blank" class="cta-btn" style="display:inline-block; padding:15px 36px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:50px; letter-spacing:0.3px;">
                            Vedi i tuoi Ordini &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer-pad" style="background-color:#064e3b; padding:32px 40px; border-radius:0 0 16px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <span style="font-size:16px; font-weight:800; color:#ffffff; letter-spacing:1px;">BIRILLO</span>
                    <span style="font-size:12px; color:#6ee7b7;"> Pet Shop</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <p style="margin:0; font-size:12px; color:#a7f3d0; line-height:1.6;">
                      Via Po 26/28, Piazza Aldo Moro<br/>
                      64100 Teramo (TE)
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <a href="tel:+390861210515" style="font-size:12px; color:#6ee7b7; text-decoration:none; font-weight:600;">0861 210515</a>
                    <span style="color:#4ade80; margin:0 6px;">&middot;</span>
                    <a href="mailto:birillopetshop@hotmail.it" style="font-size:12px; color:#6ee7b7; text-decoration:none; font-weight:600;">birillopetshop@hotmail.it</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0; font-size:11px; color:#4ade80; opacity:0.5;">
                      &copy; 2026 Birillo Pet Shop. Tutti i diritti riservati.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End main container -->

      </td>
    </tr>
  </table>

</body>
</html>
`;

export const orderConfirmationSubject = 'Ordine #{{ORDER_ID}} confermato - Birillo Pet Shop';

/**
 * Helper: build the items HTML rows for the email
 */
export function buildOrderItemsHtml(cartItems: any[]): string {
  return cartItems.map(item => {
    const variantLabel = item.variant ? ` <span style="font-size:11px; background:#f5f5f4; color:#78716c; padding:2px 6px; border-radius:4px; font-weight:600;">${item.variant}</span>` : '';
    const price = (item.price * item.quantity).toFixed(2);
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f5f5f4;">
        <tr>
          <td style="padding:12px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:14px; color:#1c1917; font-weight:600;">
                  ${item.name}${variantLabel}
                  <br/>
                  <span style="font-size:12px; color:#a8a29e; font-weight:400;">Qt: ${item.quantity}</span>
                </td>
                <td align="right" style="font-size:14px; color:#44403c; font-weight:600; white-space:nowrap;">
                  &euro;${price}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
  }).join('');
}

/**
 * Helper: build shipping address HTML
 */
export function buildShippingAddressHtml(shipping: any): string {
  if (!shipping) return '<em style="color:#a8a29e;">Non specificato</em>';
  const parts: string[] = [];
  if (shipping.address) parts.push(shipping.address);
  if (shipping.notes) parts.push(`<span style="color:#a8a29e; font-style:italic;">${shipping.notes}</span>`);
  if (shipping.city || shipping.zip) parts.push([shipping.city, shipping.zip].filter(Boolean).join(', '));
  if (shipping.phone) parts.push(shipping.phone);
  return parts.join('<br/>');
}
