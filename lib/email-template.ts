/**
 * Capitalize the first letter of a string
 */
function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert markdown-style links and plain URLs to HTML links
 * Supports: [text](url) and plain URLs (http/https)
 */
function convertLinksToHTML(text: string): string {
  // First, convert markdown links [text](url)
  let result = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a href="$2" style="color: #0066cc; text-decoration: underline;">$1</a>'
  );

  // Then, convert plain URLs (but not ones already in href="")
  // This regex matches URLs not preceded by href=" or ">
  result = result.replace(
    /(?<!href="|>)(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color: #0066cc; text-decoration: underline;">$1</a>'
  );

  return result;
}

/**
 * Generate HTML email template for user-sent emails (no branding)
 */
export function generateEmailHTML(body: string, signature?: string): string {
  // Capitalize first letter and convert newlines to <br> tags for body
  const htmlBody = capitalizeFirst(body).replace(/\n/g, '<br>');

  // Convert newlines to <br> tags and links to HTML for signature
  const htmlSignature = signature
    ? convertLinksToHTML(signature.replace(/\n/g, '<br>'))
    : '';

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
  let text = capitalizeFirst(body);

  if (signature) {
    text += '\n\n' + signature;
  }

  return text;
}
