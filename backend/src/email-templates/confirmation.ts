/**
 * Email template: Conferma Registrazione
 * Variables: <%= URL %>, <%= CODE %>, <%= USER.username %>, <%= USER.email %>
 */
export const confirmationEmailHtml = `
<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Conferma la tua email - Birillo Pet Shop</title>
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
                <!-- Icon -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <img src="https://res.cloudinary.com/dayxi0enk/image/upload/v1772037565/email/icon-checkmark.svg" alt="" width="64" height="64" style="width:64px; height:64px; display:block;" />
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h1 class="title" style="margin:0; font-size:24px; font-weight:700; color:#1c1917; line-height:1.3;">
                      Benvenuto su Birillo!
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <p class="subtitle" style="margin:0; font-size:15px; color:#78716c; line-height:1.6; max-width:400px;">
                      Conferma il tuo indirizzo email per attivare il tuo account e iniziare a scoprire i nostri prodotti per i tuoi amici animali.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius:50px; background-color:#008F4C; box-shadow:0 4px 14px rgba(0,143,76,0.25);">
                          <a href="<%= URL %>?confirmation=<%= CODE %>" target="_blank" class="cta-btn" style="display:inline-block; padding:15px 36px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:50px; letter-spacing:0.3px;">
                            Conferma Email &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <div style="height:1px; background-color:#f5f5f4; width:100%;"></div>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0; font-size:12px; color:#a8a29e; line-height:1.5;">
                      Se il bottone non funziona, copia e incolla questo link nel browser:
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0; font-size:11px; color:#008F4C; word-break:break-all; line-height:1.4;">
                      <%= URL %>?confirmation=<%= CODE %>
                    </p>
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

export const confirmationEmailSubject = 'Conferma la tua email - Birillo Pet Shop';
