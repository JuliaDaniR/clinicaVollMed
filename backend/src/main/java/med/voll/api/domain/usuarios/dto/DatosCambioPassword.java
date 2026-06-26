package med.voll.api.domain.usuarios.dto;

import jakarta.validation.constraints.NotBlank;

public record DatosCambioPassword(
        @NotBlank String passwordActual,
        @NotBlank String nuevaPassword,
        @NotBlank String repetirPassword
) {}
