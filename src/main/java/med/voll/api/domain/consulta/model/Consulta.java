package med.voll.api.domain.consulta.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.consulta.model.enumerator.MotivoCancelamiento;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.paciente.model.Paciente;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultas")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Consulta {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_cancelamiento")
    private MotivoCancelamiento motivoCancelamiento;

    public Consulta(Medico medico, Paciente paciente, LocalDateTime fecha) {
        this.medico = medico;
        this.paciente = paciente;
        this.fecha = fecha;
        this.cancelada = false;
    }

    public void cancelar(MotivoCancelamiento motivo) {
        this.cancelada = true;
        this.motivoCancelamiento = motivo;
    }

    public void actualizar(DatosAgendarConsulta.DatosActualizarConsulta dto,
                           Medico nuevoMedico,
                           Paciente nuevoPaciente) {

        if (dto.idMedico() != null) {
            this.medico = nuevoMedico;
        }

        if (dto.idPaciente() != null) {
            this.paciente = nuevoPaciente;
        }

        if (dto.fecha() != null) {
            this.fecha = dto.fecha();
        }

        if (dto.motivoCancelamiento() != null) {
            this.motivoCancelamiento = dto.motivoCancelamiento();
        }
    }
}

