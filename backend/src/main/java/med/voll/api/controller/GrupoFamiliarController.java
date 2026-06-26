package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.familiar.dto.DatosRegistrarDependienteDTO;
import med.voll.api.domain.familiar.service.GrupoFamiliarService;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pacientes/{id}/familia")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Grupo Familiar", description = "Gestión del grupo familiar de un paciente titular")
public class GrupoFamiliarController {

    private final GrupoFamiliarService service;

    @Operation(summary = "Registrar un familiar dependiente", description = "Registra un dependiente familiar bajo un paciente titular.")
    @PostMapping
    public ResponseEntity<ApiResponseDTO> registrarDependiente(
            @PathVariable Long id,
            @Valid @RequestBody DatosRegistrarDependienteDTO dto,
            @AuthenticationPrincipal Usuario auth
    ) {
        ApiResponseDTO respuesta = service.registrarDependiente(id, dto, auth);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    @Operation(summary = "Listar familiares dependientes", description = "Lista todos los familiares dependientes de un paciente titular.")
    @GetMapping
    public ResponseEntity<ApiResponseDTO> listarFamilia(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario auth
    ) {
        ApiResponseDTO respuesta = service.listarFamilia(id, auth);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    @Operation(summary = "Desvincular y desactivar familiar", description = "Desvincula un familiar dependiente de un paciente titular.")
    @DeleteMapping("/{dependienteId}")
    public ResponseEntity<ApiResponseDTO> desvincular(
            @PathVariable Long id,
            @PathVariable Long dependienteId,
            @AuthenticationPrincipal Usuario auth
    ) {
        ApiResponseDTO respuesta = service.desvincular(id, dependienteId, auth);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }
}
