package med.voll.api.infra.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String from;

    public void enviarCambioEmail(String emailDestino, String token) {
        String link = "http://localhost:8080/confirmar-email?token=" + token;
        String contentHtml = """
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para cambiar la dirección de correo electrónico asociada a tu cuenta en VollMed.</p>
            <p>Para confirmar esta dirección, ingresa el siguiente código de verificación en la pantalla de confirmación:</p>
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; font-size: 22px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #0f172a; border: 1px solid #e2e8f0;">
                %s
            </div>
            <p>O también puedes confirmar directamente haciendo clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="%s" style="background-color: #0ea5e9; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2);">Confirmar Correo</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Si no solicitaste este cambio, puedes ignorar este correo con seguridad. Tu dirección actual permanecerá activa.</p>
            """.formatted(token, link);

        String html = buildEmailTemplate("Confirmar cambio de email", contentHtml);
        enviarEmail(emailDestino, "Confirmar cambio de email", html);
    }

    public void enviarAvisoCambioEmail(String emailViejo, String emailNuevo) {
        String contentHtml = """
            <p>Hola,</p>
            <p>Te informamos que la dirección de correo electrónico asociada a tu cuenta de <strong>VollMed</strong> ha sido cambiada con éxito.</p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin: 24px 0;">
                <tr>
                    <td style="padding: 16px 20px;">
                        <span style="color: #64748b; font-size: 14px;">Nuevo email:</span><br>
                        <strong style="color: #0f172a; font-size: 16px;">%s</strong>
                    </td>
                </tr>
            </table>
            <p style="color: #ef4444; font-weight: 500; font-size: 14px;">
                ⚠️ IMPORTANTE: Si tú no realizaste este cambio, por favor ponte en contacto con nuestro equipo de soporte técnico inmediatamente.
            </p>
            """.formatted(emailNuevo);

        String html = buildEmailTemplate("Tu email fue modificado", contentHtml);
        enviarEmail(emailViejo, "Tu email fue modificado", html);
    }

    public void enviarRecuperacionClave(String emailDestino, String token) {
        String link = "http://localhost:8080/reset-password?token=" + token;
        String contentHtml = """
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en VollMed.</p>
            <p>Usa el siguiente token de seguridad en la aplicación para restablecerla:</p>
            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center; font-size: 22px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #0f172a; border: 1px solid #e2e8f0;">
                %s
            </div>
            <p>O si lo prefieres, puedes ingresar al enlace directo de restauración:</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="%s" style="background-color: #0ea5e9; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2);">Restablecer Contraseña</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">Si no solicitaste esta restauración, ignora este correo. Tu contraseña actual no se modificará.</p>
            """.formatted(token, link);

        String html = buildEmailTemplate("Recuperar contraseña", contentHtml);
        enviarEmail(emailDestino, "Recuperar contraseña", html);
    }

    public void enviarConfirmacionCambioClave(String emailDestino) {
        String contentHtml = """
            <p>Hola,</p>
            <p>Tu contraseña ha sido cambiada correctamente en tu cuenta de <strong>VollMed</strong>.</p>
            <p>Si realizaste esta acción, no necesitas hacer nada más, los cambios ya están activos.</p>
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; color: #b45309; font-size: 14px; line-height: 1.5;">
                <strong>¿No realizaste este cambio?</strong><br>
                Te recomendamos restablecer tu contraseña inmediatamente y revisar la actividad de tu cuenta.
            </div>
            """;

        String html = buildEmailTemplate("Contraseña actualizada", contentHtml);
        enviarEmail(emailDestino, "Tu contraseña ha sido actualizada", html);
    }

    private String buildEmailTemplate(String title, String contentHtml) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f8fafc; padding: 40px 10px;">
                    <tr>
                        <td align="center">
                            <!-- Main Container Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 550px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);">
                                <!-- Header (Logo) -->
                                <tr>
                                    <td align="center" style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #f1f5f9;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background-color: #0ea5e9; border-radius: 8px; width: 36px; height: 36px; text-align: center; vertical-align: middle; font-weight: bold; color: #ffffff; font-size: 24px; font-family: Arial, sans-serif; line-height: 36px;">
                                                    +
                                                </td>
                                                <td style="padding-left: 12px; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                                                    Voll<span style="color: #0ea5e9; font-weight: 400;">Med</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Content Body -->
                                <tr>
                                    <td style="padding: 32px; color: #334155; font-size: 16px; line-height: 1.6;">
                                        <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #0f172a;">%s</h2>
                                        %s
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="padding: 24px 32px 32px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; color: #64748b; font-size: 12px; line-height: 1.5;">
                                        <p style="margin: 0; margin-bottom: 8px; font-weight: 600;">VollMed Clínica Médica</p>
                                        <p style="margin: 0;">Este es un mensaje automático, por favor no respondas a este correo.</p>
                                        <p style="margin: 8px 0 0 0; font-size: 11px;">© 2026 VollMed. Todos los derechos reservados.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(title, title, contentHtml);
    }

    public void enviarEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            helper.setFrom(from);

            mailSender.send(message);
            log.info("Email enviado exitosamente a: {}", to);

        } catch (Exception e) {
            log.error("==================================================================");
            log.error("AVISO: No se pudo enviar el correo real (SMTP no configurado/error)");
            log.error("Para: {}", to);
            log.error("Asunto: {}", subject);
            log.error("Cuerpo del Email (HTML):\n{}", html);
            log.error("Detalle del error: {}", e.getMessage());
            log.error("==================================================================");
        }
    }
}
