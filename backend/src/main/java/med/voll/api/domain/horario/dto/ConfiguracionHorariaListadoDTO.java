package med.voll.api.domain.horario.dto;

import java.util.List;

public record ConfiguracionHorariaListadoDTO(
        Long id,
        String nombre,
        boolean activa,
        int duracionTurno,
        int cantidadBloques,
        String medicoNombre,
        List<DiaHorarioDTO> dias) {
}
