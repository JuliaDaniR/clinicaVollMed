package med.voll.api.domain.recetas.dto;

public record DatosCrearReceta(
        Long idPaciente,
        Long idConsulta, // opcional
        String indicaciones
) {}
