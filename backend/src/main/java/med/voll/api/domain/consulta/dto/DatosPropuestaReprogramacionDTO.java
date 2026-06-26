package med.voll.api.domain.consulta.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record DatosPropuestaReprogramacionDTO(
        @NotNull
        @Future
        LocalDateTime fechaPropuesta
) {
}
