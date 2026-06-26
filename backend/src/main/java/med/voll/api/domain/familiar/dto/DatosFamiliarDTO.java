package med.voll.api.domain.familiar.dto;

import med.voll.api.domain.familiar.model.Parentesco;
import java.time.LocalDate;

public record DatosFamiliarDTO(
    Long id,
    String nombre,
    String dni,
    LocalDate fechaNacimiento,
    Parentesco parentesco,
    Boolean activo
) {}
