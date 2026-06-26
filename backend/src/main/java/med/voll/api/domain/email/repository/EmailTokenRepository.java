package med.voll.api.domain.email.repository;

import med.voll.api.domain.email.model.EmailToken;
import med.voll.api.domain.usuarios.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailTokenRepository extends JpaRepository<EmailToken, Long> {

    Optional<EmailToken> findByToken(String token);

    void deleteByUsuario(Usuario usuario);

    void deleteByUsuarioId(Long usuarioId);
}
