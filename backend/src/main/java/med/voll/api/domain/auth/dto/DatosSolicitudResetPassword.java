package med.voll.api.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record DatosSolicitudResetPassword(
        @Email @NotBlank String email
) {}
