package med.voll.api.domain.consulta.dto;

import jakarta.validation.constraints.NotNull;

public record DatosReprogramarConsulta(
        @NotNull Long idConsulta,
        @NotNull Long idNuevoTurno
) {}
