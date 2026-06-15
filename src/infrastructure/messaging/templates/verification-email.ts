export function getVerificationEmailHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <tr>
            <td style="padding:40px 40px 32px;text-align:center">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#18181b">Verify your email address</h1>
              <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#52525b">
                Thanks for creating an account! Enter the code below to verify your email address.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;text-align:center">
              <div style="display:inline-block;padding:16px 40px;font-size:36px;font-weight:700;letter-spacing:12px;color:#18181b;background-color:#f4f4f5;border-radius:12px;font-family:monospace">
                ${otp}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;text-align:center">
              <p style="margin:0;font-size:13px;color:#71717a">
                This code expires in 5 minutes. If you didn't create an account, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa">Shelter — A Digital Sanctuary for Faith and Mental Health</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
