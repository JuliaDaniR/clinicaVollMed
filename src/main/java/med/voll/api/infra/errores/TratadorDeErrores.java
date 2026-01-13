package med.voll.api.infra.errores;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ValidationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
@RestControllerAdvice
public class TratadorDeErrores {


    // ❌ Error 404 – Recurso no encontrado
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponseDTO> tratarError404() {
        return buildError(HttpStatus.NOT_FOUND, "Recurso no encontrado", null);
    }


    // ❌ Error 400 – Validación de campos (Bean Validation)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponseDTO> tratarError400(MethodArgumentNotValidException e) {

        var errores = e.getFieldErrors().stream()
                .map(err -> Map.of(
                        "campo", err.getField(),
                        "error", err.getDefaultMessage()
                ))
                .toList();

        return buildError(HttpStatus.BAD_REQUEST, "Errores de validación", errores);
    }


    // ❌ Error 400 – Duplicados / integridad
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponseDTO> tratarErrorDuplicados(DataIntegrityViolationException e) {
        return buildError(HttpStatus.BAD_REQUEST, "Registro duplicado o datos inválidos", null);
    }


    // ❌ Error 400 – Reglas de negocio (ValidacionIntegridad y ValidationException)
    @ExceptionHandler({ ValidacionIntegridad.class, ValidationException.class })
    public ResponseEntity<ApiResponseDTO> errorHandlerReglasNegocio(Exception e) {

        return buildError(
                HttpStatus.BAD_REQUEST,
                e.getMessage(),
                null
        );
    }


    // 🔧 Helper para unificar la respuesta
    private ResponseEntity<ApiResponseDTO> buildError(HttpStatus status, String msg, Object data) {
        return ResponseEntity.status(status).body(
                new ApiResponseDTO(false, msg, data, status)
        );
    }
}

