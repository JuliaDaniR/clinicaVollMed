package med.voll.api.domain.horario.dto;

import java.util.List;

public record ConfiguracionHorariaResponseDTO(
        Long id,
        Long medicoId,
        Integer duracionTurno,
        Boolean activa,
        List<DiaHorarioDTO> dias
) {}

