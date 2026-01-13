package med.voll.api.domain.consulta.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.consulta.model.enumerator.MotivoCancelamiento;

import java.time.LocalDateTime;

public record DatosDetalleConsulta(
        Long id,
        Long idMedico,
        Long idPaciente,
        LocalDateTime fecha,
        Boolean cancelada,
        MotivoCancelamiento motivoCancelamiento
) {
    public DatosDetalleConsulta(Consulta c) {
        this(
                c.getId(),
                c.getMedico().getId(),
                c.getPaciente().getId(),
                c.getFecha(),
                c.getCancelada(),
                c.getMotivoCancelamiento()
        );
    }
}
