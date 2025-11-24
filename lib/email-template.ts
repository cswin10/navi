/**
 * Generate HTML email template for user-sent emails (no branding)
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%;">
          <!-- Body -->
          <tr>
            <td style="padding: 0; color: #000000; font-size: 14px; line-height: 1.6;">
              ${htmlBody}
            </td>
          </tr>

          ${signature ? `
          <!-- Signature -->
          <tr>
            <td style="padding-top: 20px; color: #000000; font-size: 14px; line-height: 1.6;">
              ${htmlSignature}
            </td>
          </tr>
          ` : ''}
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

  return text;
}
