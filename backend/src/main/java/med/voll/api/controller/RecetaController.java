package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.recetas.dto.DatosCrearReceta;
import med.voll.api.domain.recetas.service.RecetaService;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/recetas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Recetas", description = "Gestión de recetas médicas")
public class RecetaController {

    private final RecetaService recetaService;

    // ==========================================================
    // 1. Crear receta
    // ==========================================================
    @Operation(
            summary = "Crear una receta médica",
            description = "Solo médicos pueden emitir recetas."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Receta creada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "403", description = "Acción permitida solo para médicos"),
            @ApiResponse(responseCode = "404", description = "Paciente o consulta no encontrada")
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO> crear(@RequestBody @Valid DatosCrearReceta dto) {
        var respuesta = recetaService.crear(dto);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 2. Obtener receta
    // ==========================================================
    @Operation(
            summary = "Obtener receta por ID",
            description = """
                    Permisos:
                    - Médico que la emitió
                    - Paciente dueño de la receta
                    - Recepcionista (solo lectura)
                    """
    )
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> obtener(@PathVariable Long id) {
        var respuesta = recetaService.obtener(id);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }
}
