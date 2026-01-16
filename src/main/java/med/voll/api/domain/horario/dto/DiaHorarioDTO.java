package med.voll.api.domain.horario.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import med.voll.api.domain.horario.model.enumerator.DiaSemana;

import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;

public record DiaHorarioDTO(

        @Schema(description = "Día de la semana", example = "LUNES")
        DiaSemana dia,

        @JsonFormat(pattern = "HH:mm")
        @Schema(type = "string", example = "08:00")
        LocalTime horaInicio,

        @JsonFormat(pattern = "HH:mm")
        @Schema(type = "string", example = "16:00")
        LocalTime horaFin
) {}
