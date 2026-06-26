package med.voll.api.domain.horario.model.enumerator;

import java.time.DayOfWeek;

public enum DiaSemana {
    LUNES,
    MARTES,
    MIERCOLES,
    JUEVES,
    VIERNES,
    SABADO,
    DOMINGO;

    public static DiaSemana desde(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> LUNES;
            case TUESDAY -> MARTES;
            case WEDNESDAY -> MIERCOLES;
            case THURSDAY -> JUEVES;
            case FRIDAY -> VIERNES;
            case SUNDAY -> DOMINGO;
            case SATURDAY -> SABADO;
        };
    }
}

