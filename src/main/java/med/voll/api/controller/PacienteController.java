package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.paciente.dto.DatosListadoPaciente;
import med.voll.api.domain.paciente.dto.DatosRespuestaPaciente;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.paciente.dto.DatosRegistroPaciente;
import jakarta.validation.Valid;
import med.voll.api.domain.paciente.service.PacienteService;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/pacientes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Pacientes", description = "Gestión completa de pacientes del sistema")
public class PacienteController {

    private final PacienteService service;

    // ==========================================================
    // 1. Registrar Paciente
    // ==========================================================
    @Operation(
            summary = "Registrar un nuevo paciente",
            description = "Crea un paciente junto con su usuario asociado (ROLE_PACIENTE)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Paciente registrado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO> registrar(
            @Valid @RequestBody DatosRegistroPaciente dto,
            UriComponentsBuilder uriBuilder
    ) {
        ApiResponseDTO respuesta = service.registrar(dto);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 2. Actualizar Paciente
    // ==========================================================
    @Operation(
            summary = "Actualizar paciente",
            description = "Modifica los datos básicos del paciente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paciente actualizado"),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody DatosRegistroPaciente.DatosActualizarPaciente dto,
            @RequestHeader("email") String emailActual
    ) {
        ApiResponseDTO respuesta = service.actualizar(id, dto, emailActual);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 3. Desactivar Paciente
    // ==========================================================
    @Operation(
            summary = "Desactivar paciente",
            description = "Desactiva al paciente y su usuario asociado. Solo Admin/Recepción."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Paciente desactivado"),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> desactivar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario auth
    ) {
        ApiResponseDTO respuesta = service.desactivar(id, auth);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 4. Activar Paciente
    // ==========================================================
    @Operation(
            summary = "Activar paciente",
            description = "Activa nuevamente al paciente y su usuario asociado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paciente activado"),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado")
    })
    @PatchMapping("/{id}/activar")
    public ResponseEntity<ApiResponseDTO> activar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario auth
    ) {
        ApiResponseDTO respuesta = service.activar(id, auth);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 5. Obtener Paciente por ID
    // ==========================================================
    @Operation(
            summary = "Obtener paciente",
            description = "Devuelve los datos completos del paciente solicitado."
    )
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> obtener(@PathVariable Long id) {
        ApiResponseDTO resp = service.obtener(id);
        return ResponseEntity.status(resp.status()).body(resp);
    }

    // ==========================================================
    // 6. Listar Pacientes
    // ==========================================================
    @Operation(
            summary = "Listar pacientes",
            description = "Devuelve un listado paginado de pacientes."
    )
    @GetMapping
    public ResponseEntity<ApiResponseDTO> listar(Pageable pageable) {
        ApiResponseDTO resp = service.listar(pageable);
        return ResponseEntity.status(resp.status()).body(resp);
    }
}
