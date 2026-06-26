package med.voll.api.infra.security.refresh;

import lombok.RequiredArgsConstructor;
import med.voll.api.domain.auth.model.RefreshToken;
import med.voll.api.domain.auth.repository.RefreshTokenRepository;
import med.voll.api.domain.usuarios.model.Usuario;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository repo;

    public RefreshToken crearRefreshToken(Usuario usuario) {

        // Revoca tokens antiguos del usuario
        repo.findAll().stream()
                .filter(rt -> rt.getUsuario().equals(usuario) && !rt.isRevoked())
                .forEach(rt -> {
                    rt.setRevoked(true);
                    repo.save(rt);
                });

        RefreshToken rt = RefreshToken.builder()
                .usuario(usuario)
                .token(UUID.randomUUID().toString())
                .expiracion(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        return repo.save(rt);
    }

    public RefreshToken validarRefreshToken(String token) {

        RefreshToken rt = repo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido"));

        if (rt.isRevoked()) {
            throw new RuntimeException("Refresh token revocado");
        }

        if (rt.expirado()) {
            rt.setRevoked(true);
            repo.save(rt);
            throw new RuntimeException("Refresh token expirado");
        }

        return rt;
    }

    public void revocar(RefreshToken rt) {
        rt.setRevoked(true);
        repo.save(rt);
    }
}


