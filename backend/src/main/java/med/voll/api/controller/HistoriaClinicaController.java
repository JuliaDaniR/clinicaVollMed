package med.voll.api.controller;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.historial.dto.DatosCrearNotaClinica;
import med.voll.api.domain.historial.service.HistoriaClinicaService;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/historia-clinica")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Historia Clínica", description = "Gestión del historial clínico del paciente")
public class HistoriaClinicaController {

    private final HistoriaClinicaService service;

    // ==========================================================
    // 1. OBTENER HISTORIA CLÍNICA
    // ==========================================================
    @Operation(
            summary = "Obtener historia clínica de un paciente",
            description = """
                    Permisos de acceso:
                    - Administrador
                    - Paciente dueño de la historia
                    - Médico que haya atendido al paciente
                    - Recepcionista (solo datos generales si corresponde)
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Historia clínica encontrada"),
            @ApiResponse(responseCode = "403", description = "Acceso no autorizado"),
            @ApiResponse(responseCode = "404", description = "Historia clínica no encontrada")
    })
    @GetMapping("/{pacienteId}")
    public ResponseEntity<ApiResponseDTO> obtener(
            @PathVariable Long pacienteId
    ) {
        var respuesta = service.obtenerPorPaciente(pacienteId);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 2. AGREGAR NOTA CLÍNICA
    // ==========================================================
    @Operation(
            summary = "Agregar una nota clínica a la historia del paciente",
            description = """
                    Solo médicos pueden agregar notas clínicas.
                    El médico autenticado será registrado como autor de la nota.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Nota clínica agregada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "403", description = "Solo médicos pueden agregar notas clínicas"),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado")
    })
    @PostMapping("/nota")
    public ResponseEntity<ApiResponseDTO> agregarNota(
            @RequestBody @Valid DatosCrearNotaClinica dto
    ) {
        var respuesta = service.agregarNota(dto);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }
}
