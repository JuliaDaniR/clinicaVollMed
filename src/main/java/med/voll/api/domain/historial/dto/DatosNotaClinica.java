package med.voll.api.domain.historial.dto;

import med.voll.api.domain.historial.domain.NotaClinica;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DatosNotaClinica(
        Long id,
        Long medicoId,
        LocalDate fecha,
        String contenido
) {
    public DatosNotaClinica(NotaClinica nota) {
        this(nota.getId(), nota.getMedico().getId(), nota.getFecha(), nota.getContenido());
    }
}
