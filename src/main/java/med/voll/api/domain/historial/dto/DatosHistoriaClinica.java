package med.voll.api.domain.historial.dto;

import med.voll.api.domain.historial.domain.HistoriaClinica;

import java.time.LocalDate;
import java.util.List;
public record DatosHistoriaClinica(
        Long historiaId,
        Long pacienteId,
        LocalDate fechaCreacion,
        List<DatosNotaClinica> notas
) {
    public DatosHistoriaClinica(HistoriaClinica h) {
        this(
                h.getId(),
                h.getPaciente().getId(),
                h.getFechaCreacion(),
                h.getNotas().stream().map(DatosNotaClinica::new).toList()
        );
    }
}
