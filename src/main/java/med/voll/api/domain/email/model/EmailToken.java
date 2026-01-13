package med.voll.api.domain.email.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.usuarios.model.Usuario;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private String token;

    @Column(nullable = false, name = "nuevo_email")
    private String nuevoEmail;

    @Column(nullable = false)
    private LocalDateTime expiracion;

    // Método utilitario
    public boolean expirado() {
        return LocalDateTime.now().isAfter(expiracion);
    }
}
