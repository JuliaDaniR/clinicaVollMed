package med.voll.api.domain.email.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record DatosSolicitudCambioEmail(
       @Email @NotBlank String nuevoEmail
) {}

