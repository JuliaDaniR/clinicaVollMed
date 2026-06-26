package med.voll.api.domain.horario.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record TurnoAccionDTO(
        Long id,
        LocalDate fecha,
        LocalTime hora,
        String estado
) {}