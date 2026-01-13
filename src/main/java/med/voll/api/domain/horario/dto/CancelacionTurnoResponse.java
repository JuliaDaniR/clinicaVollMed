package med.voll.api.domain.horario.dto;

import med.voll.api.domain.horario.model.enumerator.EstadoTurno;

public record CancelacionTurnoResponse(
        Long turnoId,
        EstadoTurno estado
) {}
