package med.voll.api.domain.email.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.email.model.EmailToken;
import med.voll.api.domain.email.repository.EmailTokenRepository;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.repository.IUsuarioRepository;
import med.voll.api.infra.email.EmailService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailCambioService {

    private final EmailTokenRepository tokenRepo;
    private final IUsuarioRepository usuarioRepo;
    private final EmailService emailService;

    @Transactional
    public void solicitarCambioEmail(Long usuarioId, String nuevoEmail) {

        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        tokenRepo.deleteByUsuarioId(usuarioId);

        String token = UUID.randomUUID().toString();

        EmailToken emailToken = EmailToken.builder()
                .usuario(usuario)
                .token(token)
                .nuevoEmail(nuevoEmail)
                .expiracion(LocalDateTime.now().plusMinutes(30))
                .build();

        tokenRepo.save(emailToken);

        // enviar email
        emailService.enviarCambioEmail(nuevoEmail, token);
    }

    @Transactional
    public void confirmarCambioEmail(String token) {

        EmailToken emailToken = tokenRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido o expirado"));

        if (emailToken.getExpiracion().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expirado");
        }

        Usuario usuario = emailToken.getUsuario();

        // Guardamos el email "viejo" ANTES de cambiarlo
        String emailViejo = usuario.getEmail();
        String emailNuevo = emailToken.getNuevoEmail();

        // Cambiar email
        usuario.setEmail(emailNuevo);
        usuarioRepo.save(usuario);

        // Borrar token
        tokenRepo.delete(emailToken);

        // Enviar email de aviso
        emailService.enviarAvisoCambioEmail(emailViejo, emailNuevo);
    }
}
