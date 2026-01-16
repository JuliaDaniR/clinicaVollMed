package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.auth.model.RefreshToken;
import med.voll.api.domain.auth.dto.DatosConfirmarResetPassword;
import med.voll.api.domain.auth.dto.DatosSolicitudResetPassword;
import med.voll.api.domain.usuarios.dto.DatosAutenticacionUsuario;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.security.TokenService;
import med.voll.api.infra.security.refresh.RefreshRequest;
import med.voll.api.infra.security.refresh.RefreshTokenService;
import med.voll.api.infra.security.reset.PasswordResetService;
import org.springframework.http.ResponseEntity;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints para login, refresco de tokens y recuperación de contraseña")
public class AutenticacionController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final PasswordResetService passwordResetService;
    private final RefreshTokenService refreshTokenService;

    // ============================================================
    // LOGIN
    // ============================================================
    @Operation(
            summary = "Iniciar sesión",
            description = "Autentica un usuario mediante email y contraseña, devolviendo tokens JWT (access + refresh)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa"),
            @ApiResponse(responseCode = "401", description = "Credenciales inválidas")
    })
    @PostMapping("/login")
    public ResponseEntity<?> autenticarUsuario(
            @RequestBody @Valid DatosAutenticacionUsuario dto) {

        Authentication authToken =
                new UsernamePasswordAuthenticationToken(dto.email(), dto.clave());

        var auth = authenticationManager.authenticate(authToken);
        Usuario usuario = (Usuario) auth.getPrincipal();

        String accessToken = tokenService.generarAccessToken(usuario);
        RefreshToken refreshToken = refreshTokenService.crearRefreshToken(usuario);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Inicio de sesión exitoso",
                "data", Map.of(
                        "access_token", accessToken,
                        "refresh_token", refreshToken.getToken(),
                        "expires_in", 900,
                        "token_type", "Bearer"
                )
        ));
    }

    // ============================================================
    // SOLICITAR RESET PASSWORD
    // ============================================================
    @Operation(
            summary = "Solicitar restablecimiento de contraseña",
            description = "Envía un email con el token de recuperación al usuario registrado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email enviado"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<?> solicitarReset(
            @RequestBody @Valid DatosSolicitudResetPassword dto) {

        passwordResetService.solicitar(dto.email());
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Email enviado correctamente"
        ));
    }

    // ============================================================
    // RESET PASSWORD
    // ============================================================
    @Operation(
            summary = "Restablecer contraseña",
            description = "Actualiza la contraseña del usuario utilizando un token válido enviado por email."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contraseña actualizada"),
            @ApiResponse(responseCode = "400", description = "Token inválido o expirado")
    })
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetear(
            @RequestBody @Valid DatosConfirmarResetPassword dto) {

        passwordResetService.resetear(dto.token(), dto.nuevaClave());

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Contraseña actualizada correctamente"
        ));
    }

    // ============================================================
    // REFRESH TOKEN
    // ============================================================
    @Operation(
            summary = "Renovar tokens JWT",
            description = "Recibe un refresh token válido y devuelve uno nuevo junto con un nuevo access token."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tokens renovados"),
            @ApiResponse(responseCode = "401", description = "Refresh token inválido o expirado")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @RequestBody RefreshRequest request) {

        String refreshTokenStr = request.refreshToken();
        RefreshToken refreshToken = refreshTokenService.validarRefreshToken(refreshTokenStr);

        Usuario usuario = refreshToken.getUsuario();

        String nuevoAccess = tokenService.generarAccessToken(usuario);
        RefreshToken nuevoRefresh = refreshTokenService.crearRefreshToken(usuario);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Tokens renovados",
                "data", Map.of(
                        "access_token", nuevoAccess,
                        "refresh_token", nuevoRefresh.getToken(),
                        "expires_in", 900,
                        "token_type", "Bearer"
                )
        ));
    }

    // ============================================================
    // LOGOUT
    // ============================================================
    @Operation(
            summary = "Cerrar sesión",
            description = "Revoca el refresh token, invalidando todos los futuros intentos de renovación."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sesión cerrada"),
            @ApiResponse(responseCode = "400", description = "Refresh token inválido")
    })
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> body) {

        String refreshTokenStr = body.get("refreshToken");

        RefreshToken refreshToken = refreshTokenService.validarRefreshToken(refreshTokenStr);
        refreshTokenService.revocar(refreshToken);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Sesión cerrada correctamente"
        ));
    }
}
