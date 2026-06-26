package med.voll.api.domain.recetas.dto;

import java.time.LocalDate;

public record DatosDetalleReceta (
    Long id,
    Long idMedico,
    Long idPaciente,
    Long idConsulta,
    LocalDate fecha,
    String indicaciones
){
}
