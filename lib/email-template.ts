/**
 * Generate HTML email template for Navi-sent emails
 */
export function generateEmailHTML(body: string, signature?: string): string {
  // Convert newlines to <br> tags for body
  const htmlBody = body.replace(/\n/g, '<br>');

  // Convert newlines to <br> tags for signature
  const htmlSignature = signature ? signature.replace(/\n/g, '<br>') : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email from Navi</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; border-bottom: 1px solid #e5e7eb;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 24px;">✨</span>
                <span style="font-size: 18px; font-weight: 600; color: #1e293b;">Sent via NaviOS</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; color: #334155; font-size: 15px; line-height: 1.6;">
              ${htmlBody}
            </td>
          </tr>

          ${signature ? `
          <!-- Signature -->
          <tr>
            <td style="padding: 0 40px 40px 40px; color: #64748b; font-size: 14px; line-height: 1.5; border-top: 1px solid #e5e7eb;">
              <div style="margin-top: 20px;">
                ${htmlSignature}
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                This email was sent by your AI assistant via
                <a href="https://navios.ai" style="color: #3b82f6; text-decoration: none;">NaviOS</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of email (fallback for email clients that don't support HTML)
 */
export function generateEmailText(body: string, signature?: string): string {
  let text = body;

  if (signature) {
    text += '\n\n' + signature;
  }

  text += '\n\n---\nSent via NaviOS';

  return text;
}
