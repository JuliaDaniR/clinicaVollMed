package med.voll.api.domain.horario.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.horario.model.enumerator.DiaSemana;

import java.time.LocalTime;

@Entity
@Table(name = "dia_horario_medico")
@Getter
@Setter @NoArgsConstructor @AllArgsConstructor
public class DiaHorarioMedico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private DiaSemana dia;

    private LocalTime horaInicio;
    private LocalTime horaFin;

    @ManyToOne(optional = false)
    @JoinColumn(name = "configuracion_id")
    private ConfiguracionHorariaMedico configuracion;
}
