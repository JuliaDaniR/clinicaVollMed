package med.voll.api.domain.horario.dto;

import java.util.List;

public record ConfiguracionHorariaDTO(
        Long medicoId,
        String nombre,
        Integer duracionPersonalizada,       // null → usar la duración de la especialidad
        List<DiaHorarioDTO> dias
) {}
