package med.voll.api.domain.consulta.validaciones;

import java.time.LocalDateTime;

public record DatosValidacionConsulta(
        Long idPaciente,
        Long idMedico,
        LocalDateTime fecha
) {}