package med.voll.api.domain.horario.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.horario.model.enumerator.EstadoTurno;
import med.voll.api.domain.medico.model.Medico;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "turnos_disponibles",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"medico_id", "fecha", "hora"}
        )
)
@Getter
@Setter @NoArgsConstructor @AllArgsConstructor
public class TurnoDisponible {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate fecha;
    private LocalTime hora;

    @ManyToOne
    @JoinColumn(name = "medico_id")
    private Medico medico;

    @Enumerated(EnumType.STRING)
    private EstadoTurno estado; // DISPONIBLE, RESERVADO, BLOQUEADO
}
