# Supabase Email Template Customization

This guide shows you how to customize the Supabase authentication emails with Navi AI branding.

## Step 1: Access Email Templates

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates** in the left sidebar

## Step 2: Customize "Confirm signup" Template

### Email Subject:
```
Welcome to Navi AI - Confirm Your Email
```

### Email Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1e293b; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                ✨ Navi AI
              </h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 16px;">
                Your AI Personal Operating System
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; color: #e2e8f0;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Welcome aboard! 🎉
              </h2>

              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
                We're excited to have you join Navi AI! You're about to experience a completely new way of managing your life with AI.
              </p>

              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6;">
                Click the button below to confirm your email address and start using Navi:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}"
                   style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                  Confirm Email Address
                </a>
              </div>

              <p style="margin: 32px 0 0 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Or copy and paste this URL into your browser:<br>
                <span style="color: #60a5fa; word-break: break-all;">{{ .ConfirmationURL }}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #0f172a; border-top: 1px solid #334155;">
              <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                What you can do with Navi AI:
              </p>
              <ul style="margin: 0; padding: 0; list-style: none; text-align: center; color: #94a3b8; font-size: 13px;">
                <li style="margin: 8px 0;">📧 Send emails by voice</li>
                <li style="margin: 8px 0;">📅 Manage your calendar</li>
                <li style="margin: 8px 0;">✅ Create and track tasks</li>
                <li style="margin: 8px 0;">🧠 Build your AI knowledge base</li>
              </ul>

              <p style="margin: 24px 0 0 0; color: #64748b; font-size: 12px; text-align: center;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Step 3: Customize "Magic Link" Template (Optional)

If users use magic link login instead of password:

### Email Subject:
```
Your Navi AI Magic Link 🔗
```

### Email Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1e293b; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                ✨ Navi AI
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px; color: #e2e8f0;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Your Magic Link 🔗
              </h2>

              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6;">
                Click the button below to sign in to your Navi AI account:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}"
                   style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Sign In to Navi AI
                </a>
              </div>

              <p style="margin: 32px 0 0 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                This link expires in 1 hour.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2024 Navi AI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Step 4: Test the Templates

1. Click **Save** after customizing each template
2. Create a new test account to see the confirmation email
3. Check both desktop and mobile email clients
4. Verify all links work correctly

## Step 5: Customize Redirect URLs (Important!)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://navi-mocha-nine.vercel.app`
3. Add to **Redirect URLs**:
   - `https://navi-mocha-nine.vercel.app/auth/callback`
   - `https://navi-mocha-nine.vercel.app/voice`

## Tips for Email Design

- **Keep it simple**: Email clients have limited CSS support
- **Use tables**: For layout structure (inline styles only)
- **Test thoroughly**: Check Gmail, Outlook, Apple Mail, and mobile
- **Avoid external images**: Inline or use absolute URLs
- **Be responsive**: Use max-width and percentages

## Common Issues

### Emails going to spam:
- Make sure your Site URL is set correctly
- Add SPF/DKIM records to your domain (if using custom domain)
- Avoid spammy language

### Broken links:
- Double-check the `{{ .ConfirmationURL }}` template variable
- Verify redirect URLs are added in URL Configuration

### Styling not showing:
- Use inline styles only (no external CSS)
- Test with Email on Acid or Litmus if possible
- Gmail strips `<style>` tags - use inline styles

## Need Help?

If you encounter issues:
1. Check Supabase logs: **Authentication** → **Logs**
2. Test with a personal email first
3. Verify all URLs in the dashboard match your deployment
