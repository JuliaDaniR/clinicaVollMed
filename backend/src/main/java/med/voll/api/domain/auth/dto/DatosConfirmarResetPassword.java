package med.voll.api.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record DatosConfirmarResetPassword(
        @NotBlank String token,
        @NotBlank String nuevaClave
) {}
