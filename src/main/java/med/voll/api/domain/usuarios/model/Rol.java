package med.voll.api.domain.usuarios.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true)
    private NombreRol nombre;

    public enum NombreRol {
        ROLE_ADMIN,
        ROLE_RECEPCIONISTA,
        ROLE_MEDICO,
        ROLE_PACIENTE
    }
}
