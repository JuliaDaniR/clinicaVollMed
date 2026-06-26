package med.voll.api.domain.horario.dto;

import med.voll.api.domain.horario.model.enumerator.EstadoTurno;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservaTurnoResponse(
        Long turnoId,
        LocalDate fecha,
        LocalTime hora,
        EstadoTurno estado
) {}
