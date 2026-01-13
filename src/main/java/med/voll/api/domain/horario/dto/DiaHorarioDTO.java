package med.voll.api.domain.horario.dto;

import med.voll.api.domain.horario.model.enumerator.DiaSemana;

import java.time.LocalTime;

public record DiaHorarioDTO(
        DiaSemana dia,
        LocalTime horaInicio,
        LocalTime horaFin
) {}