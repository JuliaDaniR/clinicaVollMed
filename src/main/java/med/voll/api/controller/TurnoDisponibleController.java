package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.dto.TurnoAccionDTO;
import med.voll.api.domain.horario.dto.TurnoDisponibleDTO;
import med.voll.api.domain.horario.service.TurnoDisponibleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/turnos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Turnos", description = "Gestión de turnos disponibles, reservas y bloqueos")
public class TurnoDisponibleController {

    private final TurnoDisponibleService turnoService;

    // ==========================================================
    // 1. Listar turnos disponibles por médico
    // ==========================================================
    @Operation(
            summary = "Listar turnos disponibles por médico",
            description = "Devuelve todos los turnos disponibles futuros del médico indicado."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turnos obtenidos correctamente"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado")
    })
    @GetMapping("/medico/{id}")
    public ResponseEntity<?> listar(@PathVariable Long id) {

        List<TurnoDisponibleDTO> lista = turnoService.listarDisponibles(id);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "total", lista.size(),
                "data", lista
        ));
    }

    // ==========================================================
    // 2. Reservar turno
    // ==========================================================
    @Operation(
            summary = "Reservar un turno",
            description = "Marca un turno como reservado. Usado por Recepción o Pacientes."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turno reservado exitosamente"),
            @ApiResponse(responseCode = "400", description = "El turno no está disponible"),
            @ApiResponse(responseCode = "404", description = "Turno no encontrado")
    })
    @PostMapping("/{turnoId}/reservar")
    public ResponseEntity<?> reservar(@PathVariable Long turnoId) {

        TurnoAccionDTO dto = turnoService.reservar(turnoId);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Turno reservado correctamente",
                "data", dto
        ));
    }

    // ==========================================================
    // 3. Cancelar reserva
    // ==========================================================
    @Operation(
            summary = "Cancelar un turno reservado",
            description = "Devuelve el turno a estado DISPONIBLE."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turno cancelado"),
            @ApiResponse(responseCode = "404", description = "Turno no encontrado")
    })
    @PostMapping("/{turnoId}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long turnoId) {

        TurnoAccionDTO dto = turnoService.cancelar(turnoId);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Turno cancelado correctamente",
                "data", dto
        ));
    }

    // ==========================================================
    // 4. Bloquear rango de fechas (licencia / vacaciones)
    // ==========================================================
    @Operation(
            summary = "Bloquear rango de fechas",
            description = "Bloquea todos los turnos del médico entre las fechas indicadas."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turnos bloqueados"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado")
    })
    @PostMapping("/medico/{id}/bloquear")
    public ResponseEntity<?> bloquear(
            @PathVariable Long id,
            @Parameter(description = "Fecha en formato yyyy-MM-dd", example = "2026-02-14")
            @RequestParam LocalDate desde,
            @Parameter(description = "Fecha en formato yyyy-MM-dd", example = "2026-02-14")
            @RequestParam LocalDate hasta
    ) {

        turnoService.bloquearRango(id, desde, hasta);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Turnos bloqueados correctamente",
                "data", Map.of(
                        "medicoId", id,
                        "desde", desde,
                        "hasta", hasta
                )
        ));
    }

    // ==========================================================
    // 5. Desbloquear rango de fechas (revertir bloqueo)
    // ==========================================================
    @Operation(
            summary = "Desbloquear rango de fechas",
            description = "Revierte el bloqueo de turnos del médico entre las fechas indicadas."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turnos desbloqueados"),
            @ApiResponse(responseCode = "404", description = "Médico no encontrado")
    })
    @PostMapping("/medico/{id}/desbloquear")
    public ResponseEntity<?> desbloquear(
            @PathVariable Long id,
            @Parameter(description = "Fecha en formato yyyy-MM-dd", example = "2026-02-14")
            @RequestParam LocalDate desde,
            @Parameter(description = "Fecha en formato yyyy-MM-dd", example = "2026-02-14")
            @RequestParam LocalDate hasta
    ) {

        turnoService.desbloquearRango(id, desde, hasta);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Turnos desbloqueados correctamente",
                "data", Map.of(
                        "medicoId", id,
                        "desde", desde,
                        "hasta", hasta
                )
        ));
    }
}
