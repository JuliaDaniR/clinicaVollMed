package med.voll.api.domain.horario.dto;

public record ConfiguracionHorariaListadoDTO(
        Long id,
        boolean activa,
        int duracionTurno,
        int cantidadBloques,
        String medicoNombre) {
}
