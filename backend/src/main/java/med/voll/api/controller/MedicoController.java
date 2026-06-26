package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.medico.dto.*;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.service.MedicoService;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/medicos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Médicos", description = "Gestión completa de médicos del sistema")
public class MedicoController {

    private final MedicoService service;

    // ==========================================================
    // 1. Registrar médico (Admin / Recepción)
    // ==========================================================
    @Operation(
            summary = "Registrar un nuevo médico",
            description = "Crea un médico junto con su usuario asociado (ROLE_MEDICO). "
                    + "Accesible solo por Admin o Recepción."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Médico registrado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO> registrar(
            @Valid @RequestBody DatosRegistroMedico dto,
            UriComponentsBuilder uriBuilder
    ) {
        ApiResponseDTO respuesta = service.registrar(dto);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 2. Actualizar médico (Admin / Recepción)
    // ==========================================================
    @Operation(
            summary = "Actualizar médico por ID",
            description = "Actualiza los datos personales y profesionales de un médico existente."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Médico actualizado"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody DatosActualizarMedico dto,
            @RequestHeader("email") String emailActual
    ) {
        ApiResponseDTO respuesta = service.actualizarPerfil(id, dto, emailActual);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 3. Actualizar perfil propio (solo Médico)
    // ==========================================================
    @Operation(
            summary = "Actualizar mi propio perfil",
            description = "Permite al médico autenticado modificar su información personal y profesional."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Perfil actualizado"),
            @ApiResponse(responseCode = "403", description = "Operación no permitida")
    })
    @PutMapping("/mi-perfil")
    public ResponseEntity<ApiResponseDTO> actualizarMiPerfil(
            @Valid @RequestBody DatosActualizarPerfilMedico dto,
            @RequestHeader("email") String emailActual
    ) {
        ApiResponseDTO respuesta = service.actualizarMiPerfil(dto, emailActual);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 4. Desactivar médico (Admin)
    // ==========================================================
    @Operation(
            summary = "Desactivar médico",
            description = "Desactiva al médico y su usuario asociado. Solo Admin."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Médico desactivado"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado")
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
    // 5. Activar médico (Admin)
    // ==========================================================
    @Operation(
            summary = "Activar médico",
            description = "Activa nuevamente al médico y su usuario asociado. Solo Admin."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Médico activado"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado")
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
    // 6. Obtener médico por ID
    // ==========================================================
    @Operation(
            summary = "Obtener médico",
            description = "Devuelve la información completa de un médico por su ID."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Datos obtenidos"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> obtener(@PathVariable Long id) {
        ApiResponseDTO respuesta = service.obtener(id);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 7. Listar médicos
    // ==========================================================
    @Operation(
            summary = "Listar médicos",
            description = "Devuelve un listado paginado de médicos registrados."
    )
    @ApiResponse(responseCode = "200", description = "Listado obtenido")
    @GetMapping
    public ResponseEntity<ApiResponseDTO> listar(Pageable pageable) {
        ApiResponseDTO respuesta = service.listar(pageable);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }
}
