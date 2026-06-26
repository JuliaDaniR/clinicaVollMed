package med.voll.api.infra.security.reset;

import lombok.RequiredArgsConstructor;

import med.voll.api.domain.auth.repository.PasswordResetTokenRepository;
import med.voll.api.domain.auth.model.PasswordResetToken;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.repository.IUsuarioRepository;
import med.voll.api.infra.email.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepo;
    private final IUsuarioRepository usuarioRepo;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void solicitar(String email) {

        Usuario usuario = usuarioRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No existe un usuario con ese email"));

        tokenRepo.deleteByUsuarioId(usuario.getId());

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .usuario(usuario)
                .token(token)
                .expiracion(LocalDateTime.now().plusMinutes(30))
                .build();

        tokenRepo.save(resetToken);

        emailService.enviarRecuperacionClave(email, token);
    }

    @Transactional
    public void resetear(String token, String nuevaClave) {

        PasswordResetToken prt = tokenRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido o expirado"));

        if (prt.expirado()) {
            throw new RuntimeException("El token ha expirado");
        }

        Usuario usuario = prt.getUsuario();
        usuario.setClave(passwordEncoder.encode(nuevaClave));

        usuarioRepo.save(usuario);
        tokenRepo.delete(prt);

        emailService.enviarConfirmacionCambioClave(usuario.getEmail());
    }
}
