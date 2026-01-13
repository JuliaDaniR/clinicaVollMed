package med.voll.api.domain.auth.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.usuarios.model.Usuario;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiracion;

    public boolean expirado() {
        return LocalDateTime.now().isAfter(expiracion);
    }
}