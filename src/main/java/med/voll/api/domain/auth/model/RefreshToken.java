package med.voll.api.domain.auth.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.usuarios.model.Usuario;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, unique = true, length = 200)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiracion;

    @Column(nullable = false)
    private boolean revoked = false;

    public boolean expirado() {
        return LocalDateTime.now().isAfter(expiracion);
    }
}
