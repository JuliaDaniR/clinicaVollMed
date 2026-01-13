package med.voll.api.domain.horario.dto;

import java.util.List;

public record ConfiguracionHorariaDTO(
        Long medicoId,
        Integer duracionPersonalizada,       // null → usar la duración de la especialidad
        List<DiaHorarioDTO> dias
) {}
