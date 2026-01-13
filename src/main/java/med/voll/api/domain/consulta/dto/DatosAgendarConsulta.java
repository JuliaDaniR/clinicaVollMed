package med.voll.api.domain.consulta.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import med.voll.api.domain.consulta.model.enumerator.MotivoCancelamiento;
import med.voll.api.domain.medico.model.enumerator.Especialidad;

import java.time.LocalDateTime;

public record DatosAgendarConsulta(
        @NotNull Long idPaciente,
        Long idMedico,
        @NotNull Especialidad especialidad,
        @NotNull @Future LocalDateTime fecha
) {

    public record DatosActualizarConsulta(
            @NotNull Long id,
            Long idPaciente,
            Long idMedico,
            LocalDateTime fecha,
            MotivoCancelamiento motivoCancelamiento
    ) {}
}
