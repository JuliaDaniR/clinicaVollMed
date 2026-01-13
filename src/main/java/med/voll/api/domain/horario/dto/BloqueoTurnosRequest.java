package med.voll.api.domain.horario.dto;

import java.time.LocalDate;

public record BloqueoTurnosRequest(
        Long medicoId,
        LocalDate desde,
        LocalDate hasta
) {}

