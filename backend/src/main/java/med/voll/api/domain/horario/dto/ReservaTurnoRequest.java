package med.voll.api.domain.horario.dto;

public record ReservaTurnoRequest(
        Long turnoId,
        Long pacienteId
) {}

