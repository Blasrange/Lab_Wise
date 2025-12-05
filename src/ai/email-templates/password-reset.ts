interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
}

export const generatePasswordResetEmail = ({
  userName,
  resetLink,
}: PasswordResetEmailProps): string => {
  const language = "es"; // Hardcode to Spanish

  const translations = {
    es: {
      subject: "Restablecimiento de Contraseña para LabWise",
      header: "Solicitud de Restablecimiento de Contraseña",
      greeting: `Hola, ${userName}`,
      instruction:
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta en LabWise. Haz clic en el botón de abajo para continuar. Si no solicitaste esto, puedes ignorar este correo de forma segura.",
      buttonText: "Restablecer Contraseña",
      footerText:
        "Este correo fue enviado automáticamente. Por favor, no respondas.",
      systemName: "Sistema de Gestión de Equipos LabWise",
    },
  };

  const t = translations[language];

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f7; color: #333; }
        .container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #17A2B8; color: #ffffff; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .content { padding: 30px; text-align: center; }
        .content p { font-size: 16px; line-height: 1.6; margin: 0 0 25px; }
        .button-container { margin: 30px 0; }
        .button { background-color: #17A2B8; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t.header}</h1>
        </div>
        <div class="content">
          <p><strong>${t.greeting},</strong></p>
          <p>${t.instruction}</p>
          <div class="button-container">
            <a href="${resetLink}" class="button">${t.buttonText}</a>
          </div>
        </div>
        <div class="footer">
          <p>${t.systemName}</p>
          <p>${t.footerText}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
