package med.voll.api.infra.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String from;

    public void enviarCambioEmail(String emailDestino, String token) {

        String link = "http://localhost:8080/confirmar-email?token=" + token;

        String html = """
            <h1>Confirmar cambio de email</h1>
            <p>Usa este token para confirmar tu cambio:</p>
            <h2>%s</h2>

            <p>O también podés hacerlo desde este enlace:</p>
            <a href="%s">%s</a>
            """.formatted(token, link, link);

        enviarEmail(emailDestino, "Confirmar cambio de email", html);
    }

    public void enviarAvisoCambioEmail(String emailViejo, String emailNuevo) {

        String html = """
            <h1>Tu email fue cambiado</h1>
            <p>Te informamos que el email asociado a tu cuenta fue actualizado.</p>
            <p><strong>Nuevo email:</strong> %s</p>
            <p>Si no fuiste vos, por favor contactá a soporte de inmediato.</p>
            """.formatted(emailNuevo);

        enviarEmail(emailViejo, "Tu email fue modificado", html);
    }
    public void enviarRecuperacionClave(String emailDestino, String token) {
        String link = "http://localhost:8080/reset-password?token=" + token;

        String html = """
            <h1>Recuperación de contraseña</h1>
            <p>Usá este token para restablecer tu contraseña:</p>
            <h2>%s</h2>
            <p>O hacelo desde este enlace:</p>
            <a href="%s">%s</a>
            """.formatted(token, link, link);

        enviarEmail(emailDestino, "Recuperar contraseña", html);
    }

    public void enviarConfirmacionCambioClave(String emailDestino) {

        String html = """
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
            <h2 style="color:#2E86C1;">Contraseña actualizada</h2>

            <p>Tu contraseña ha sido cambiada correctamente en tu cuenta de <strong>VollMed</strong>.</p>

            <p style="margin-top:20px;">
                Si vos realizaste esta acción, no necesitás hacer nada más.
            </p>

            <p style="color:#C0392B; font-weight:bold; margin-top:20px;">
                Si NO realizaste el cambio, te recomendamos actualizar nuevamente tu contraseña y revisar tu actividad.
            </p>

            <hr style="margin-top:30px;">

            <p style="font-size:12px; color:#555;">
                Este mensaje se envió automáticamente. Por favor, no respondas a este correo.
            </p>
        </div>
        """;

        enviarEmail(emailDestino, "Tu contraseña ha sido actualizada", html);
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

        } catch (Exception e) {
            throw new RuntimeException("Error enviando email", e);
        }
    }
}
