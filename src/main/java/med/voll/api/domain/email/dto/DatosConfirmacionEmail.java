package med.voll.api.domain.email.dto;

import jakarta.validation.constraints.NotBlank;

public record DatosConfirmacionEmail(
        @NotBlank String token
) {}
