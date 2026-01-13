package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.email.dto.DatosConfirmacionEmail;
import med.voll.api.domain.email.dto.DatosSolicitudCambioEmail;
import med.voll.api.domain.email.service.EmailCambioService;
import med.voll.api.domain.usuarios.dto.DatosActualizarRol;
import med.voll.api.domain.usuarios.dto.DatosActualizarUsuario;
import med.voll.api.domain.usuarios.dto.DatosCambioPassword;
import med.voll.api.domain.usuarios.dto.DatosRegistroUsuario;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.usuarios.service.UsuarioService;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@RestController
@RequestMapping("/usuario")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Usuarios", description = "Gestión de usuarios, roles y seguridad de cuenta")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final EmailCambioService emailCambioService;

    // ==========================================================
    // 1. Registrar nuevo usuario
    // ==========================================================
    @Operation(
            summary = "Registrar nuevo usuario",
            description = "Crea un nuevo usuario con su rol asociado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario creado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "409", description = "Email ya registrado")
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO> registrar(
            @RequestBody @Valid DatosRegistroUsuario datos,
            UriComponentsBuilder uriBuilder
    ) {
        ApiResponseDTO respuesta = usuarioService.registrarUsuario(datos, uriBuilder);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // 2. Actualizar rol del usuario
    // ==========================================================
    @Operation(
            summary = "Actualizar rol del usuario",
            description = "Permite a un administrador cambiar el rol del usuario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Rol actualizado correctamente"),
            @ApiResponse(responseCode = "403", description = "No autorizado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PatchMapping("/{id}/rol")
    public ResponseEntity<ApiResponseDTO> actualizarRol(
            @PathVariable Long id,
            @RequestBody @Valid DatosActualizarRol datos
    ) {
        ApiResponseDTO response = usuarioService.actualizarRol(id, datos);
        return ResponseEntity.status(response.status()).body(response);
    }

    // ==========================================================
    // 3. Desactivar usuario (Soft Delete)
    // ==========================================================
    @Operation(
            summary = "Desactivar usuario",
            description = "Desactiva el usuario preservando el registro (soft-delete)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario desactivado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> desactivar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario auth
    ) {
        ApiResponseDTO response = usuarioService.desactivar(id, auth);
        return ResponseEntity.ok(response);
    }

    // ==========================================================
    // 4. Activar usuario
    // ==========================================================
    @Operation(
            summary = "Activar usuario",
            description = "Vuelve a activar un usuario previamente desactivado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Usuario activado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> activar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario auth
    ) {
        ApiResponseDTO response = usuarioService.activar(id, auth);
        return ResponseEntity.ok(response);
    }

    // ==========================================================
    // 5. Actualizar datos del usuario autenticado
    // ==========================================================
    @Operation(
            summary = "Actualizar datos del usuario",
            description = "Permite actualizar nombre, teléfono o DNI."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Datos actualizados"),
            @ApiResponse(responseCode = "403", description = "No autorizado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> actualizar(
            @PathVariable Long id,
            @RequestBody DatosActualizarUsuario datos,
            @AuthenticationPrincipal Usuario usuarioAutenticado
    ) {
        ApiResponseDTO response = usuarioService.actualizarUsuario(
                id, datos, usuarioAutenticado.getEmail()
        );

        return ResponseEntity.status(response.status()).body(response);
    }

    // ==========================================================
    // 6. Cambiar contraseña
    // ==========================================================
    @Operation(
            summary = "Cambiar contraseña",
            description = "El usuario debe confirmar su clave actual para aplicar una nueva."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contraseña actualizada"),
            @ApiResponse(responseCode = "400", description = "La clave actual no coincide"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PatchMapping("/{id}/password")
    public ResponseEntity<ApiResponseDTO> cambiarPassword(
            @PathVariable Long id,
            @RequestBody @Valid DatosCambioPassword datos,
            @AuthenticationPrincipal Usuario usuarioAutenticado
    ) {

        ApiResponseDTO response = usuarioService.cambiarPassword(
                id, datos, usuarioAutenticado.getEmail()
        );

        return ResponseEntity.status(response.status()).body(response);
    }

    // ==========================================================
    // 7. Solicitar cambio de email
    // ==========================================================
    @Operation(
            summary = "Solicitar cambio de email",
            description = "Envía un enlace de confirmación al nuevo correo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Solicitud enviada al email"),
            @ApiResponse(responseCode = "400", description = "Email inválido")
    })
    @PostMapping("/cambio-email")
    public ResponseEntity<?> solicitarCambioEmail(
            @RequestBody @Valid DatosSolicitudCambioEmail datos,
            @AuthenticationPrincipal Usuario usuarioAutenticado
    ) {
        emailCambioService.solicitarCambioEmail(usuarioAutenticado.getId(), datos.nuevoEmail());

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Solicitud enviada al nuevo email"
        ));
    }

    // ==========================================================
    // 8. Confirmar cambio de email
    // ==========================================================
    @Operation(
            summary = "Confirmar cambio de email",
            description = "Aplica el cambio después de validar el token enviado al correo."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email actualizado correctamente"),
            @ApiResponse(responseCode = "400", description = "Token inválido o expirado")
    })
    @PostMapping("/confirmar-cambio-email")
    public ResponseEntity<?> confirmarCambioEmail(
            @RequestBody @Valid DatosConfirmacionEmail datos
    ) {
        emailCambioService.confirmarCambioEmail(datos.token());

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Email actualizado correctamente"
        ));
    }
}


