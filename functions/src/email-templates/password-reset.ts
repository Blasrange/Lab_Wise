
interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
}

export const generatePasswordResetEmail = ({ userName, resetLink }: PasswordResetEmailProps): string => {
  
  const emailBody = `
    Hello,
    <br><br>
    Follow this link to reset your password for your account.
    <br><br>
    <a href="${resetLink}">${resetLink}</a>
    <br><br>
    ...
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
    </head>
    <body>
      ${emailBody}
    </body>
    </html>
  `;
};
