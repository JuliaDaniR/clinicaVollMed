package med.voll.api.domain.historial.dto;

public record DatosCrearNotaClinica(
        Long pacienteId,
        Long medicoId,
        String contenido
) {}


