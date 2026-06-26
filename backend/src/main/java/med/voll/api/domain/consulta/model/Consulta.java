package med.voll.api.domain.consulta.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.consulta.model.enumerator.MotivoCancelamiento;
import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.shared.BaseAuditable;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultas")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Consulta extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medico_id")
    @JsonIgnore
    private Medico medico;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paciente_id")
    @JsonIgnore
    private Paciente paciente;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false)
    private Boolean cancelada = false;

    @Column(name = "reprogramada_pendiente", nullable = false)
    private Boolean reprogramadaPendiente = false;

    @Column(name = "fecha_propuesta")
    private LocalDateTime fechaPropuesta;

    @Column(name = "propuesta_por_medico", nullable = false)
    private Boolean propuestaPorMedico = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turno_id", nullable = false)
    private TurnoDisponible turno;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_cancelamiento")
    private MotivoCancelamiento motivoCancelamiento;

    private String motivoConsulta;

    public Consulta(Medico medico, Paciente paciente, TurnoDisponible turno, String motivoConsulta) {
        this.medico = medico;
        this.paciente = paciente;
        this.turno = turno;
        this.fecha = LocalDateTime.of(turno.getFecha(), turno.getHora());
        this.motivoConsulta = motivoConsulta;
        this.cancelada = false;
        this.reprogramadaPendiente = false;
        this.propuestaPorMedico = false;
    }

    public void cancelar(MotivoCancelamiento motivo) {
        this.cancelada = true;
        this.motivoCancelamiento = motivo;
    }

    public void reprogramar(TurnoDisponible nuevoTurno) {
        this.turno = nuevoTurno;
        this.fecha = LocalDateTime.of(nuevoTurno.getFecha(), nuevoTurno.getHora());
    }

    public void proponerReprogramacion(LocalDateTime nuevaFecha) {
        this.reprogramadaPendiente = true;
        this.fechaPropuesta = nuevaFecha;
        this.propuestaPorMedico = true;
    }

    public void aceptarReprogramacion(TurnoDisponible nuevoTurno) {
        this.turno = nuevoTurno;
        this.fecha = LocalDateTime.of(nuevoTurno.getFecha(), nuevoTurno.getHora());
        this.reprogramadaPendiente = false;
        this.fechaPropuesta = null;
        this.propuestaPorMedico = false;
    }

    public void rechazarReprogramacionMantener() {
        this.reprogramadaPendiente = false;
        this.fechaPropuesta = null;
        this.propuestaPorMedico = false;
    }
}

