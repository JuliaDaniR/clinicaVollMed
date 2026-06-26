package med.voll.api.domain.familiar.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.paciente.model.Paciente;

import java.time.LocalDate;

@Entity(name = "GrupoFamiliar")
@Table(name = "grupo_familiar")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class GrupoFamiliar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_titular_id", nullable = false)
    private Paciente pacienteTitular;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_dependiente_id", nullable = false, unique = true)
    private Paciente pacienteDependiente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Parentesco parentesco;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_vinculacion", nullable = false)
    private LocalDate fechaVinculacion = LocalDate.now();

    public GrupoFamiliar(Paciente titular, Paciente dependiente, Parentesco parentesco) {
        this.pacienteTitular = titular;
        this.pacienteDependiente = dependiente;
        this.parentesco = parentesco;
        this.activo = true;
        this.fechaVinculacion = LocalDate.now();
    }
}
