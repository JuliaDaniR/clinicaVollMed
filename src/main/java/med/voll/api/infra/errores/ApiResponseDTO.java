package med.voll.api.infra.errores;

import org.springframework.http.HttpStatus;

public record ApiResponseDTO(
        boolean success,
        String message,
        Object data,
        HttpStatus status
) {}

