package med.voll.api.domain.ia.dto;

import jakarta.validation.constraints.NotBlank;

public record DatosSolicitudAsistenciaDTO(
        @NotBlank
        String texto
) {
}
