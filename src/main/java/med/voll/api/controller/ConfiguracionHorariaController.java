package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.dto.ConfiguracionHorariaDTO;
import med.voll.api.domain.horario.dto.ConfiguracionHorariaListadoDTO;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.service.AgendaGeneratorService;
import med.voll.api.domain.horario.service.ConfiguracionHorariaMedicoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/horarios")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Horarios de Médico", description = "Gestión de configuraciones horarias y generación automática de turnos disponibles")
public class ConfiguracionHorariaController {

    private final ConfiguracionHorariaMedicoService configuracionService;
    private final AgendaGeneratorService agendaService;

    // ============================================================
    // CREAR CONFIGURACIÓN
    // ============================================================
    @Operation(
            summary = "Crear configuración de horarios",
            description = "Registra la disponibilidad del médico y genera automáticamente los turnos futuros según la configuración."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Configuración creada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos enviados por el cliente")
    })
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody @Valid ConfiguracionHorariaDTO dto,
                                   UriComponentsBuilder uriBuilder) {
        try {
            ConfiguracionHorariaMedico config = configuracionService.crearConfiguracion(dto);

            URI uri = uriBuilder.path("/horarios/{id}")
                    .buildAndExpand(config.getId()).toUri();

            int cantidadBloques = config.getDias().size();
            int cantidadTurnos = agendaService.contarTurnosGenerados(config.getMedico());

            return ResponseEntity.created(uri).body(Map.of(
                    "status", "success",
                    "message", "Configuración creada correctamente",
                    "configuracionId", config.getId(),
                    "medico", config.getMedico().getUsuario().getNombre(),
                    "bloquesHorarios", cantidadBloques,
                    "turnosGenerados", cantidadTurnos
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }


    // ============================================================
    // ACTUALIZAR CONFIGURACIÓN
    // ============================================================
    @Operation(
            summary = "Actualizar configuración horaria",
            description = "Modifica los parámetros de horarios del médico y regenera los turnos futuros a partir de hoy."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Actualización exitosa"),
            @ApiResponse(responseCode = "404", description = "Configuración no encontrada")
    })
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(
            @PathVariable Long id,
            @RequestBody @Valid ConfiguracionHorariaDTO dto) {

        try {
            ConfiguracionHorariaMedico config =
                    configuracionService.actualizarConfiguracion(id, dto);

            int turnosRegenerados = agendaService.regenerarDesdeHoy(config);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Configuración actualizada correctamente",
                    "configuracionId", config.getId(),
                    "medico", config.getMedico().getUsuario().getNombre(),
                    "bloquesHorarios", config.getDias().size(),
                    "turnosRegenerados", turnosRegenerados
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }


    // ============================================================
    // DESACTIVAR CONFIGURACIÓN
    // ============================================================
    @Operation(
            summary = "Desactivar configuración horaria",
            description = "Desactiva una configuración existente. Ya no se generarán turnos basados en ella."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Configuración desactivada")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> desactivar(@PathVariable Long id) {
        configuracionService.desactivarConfiguracion(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // LISTAR CONFIGURACIONES DEL MÉDICO
    // ============================================================
    // ============================================================
// LISTAR CONFIGURACIONES DEL MÉDICO
// ============================================================
    @Operation(
            summary = "Listar configuraciones de un médico",
            description = "Obtiene todas las configuraciones horarias activas e inactivas del médico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping("/medico/{medicoId}")
    public ResponseEntity<?> listarPorMedico(@PathVariable Long medicoId) {

        List<ConfiguracionHorariaListadoDTO> lista =
                configuracionService.listarPorMedico(medicoId);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "total", lista.size(),
                "data", lista
        ));
    }

    // ============================================================
    // REGENERAR TURNOS MANUALMENTE
    // ============================================================
    @Operation(
            summary = "Regenerar turnos futuros",
            description = "Elimina turnos futuros y los vuelve a generar utilizando la configuración indicada."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turnos regenerados"),
            @ApiResponse(responseCode = "404", description = "Configuración no encontrada")
    })
    @PostMapping("/{id}/regenerar")
    public ResponseEntity<?> regenerar(@PathVariable Long id) {

        try {
            ConfiguracionHorariaMedico config = configuracionService.obtenerPorId(id);

            int generados = agendaService.regenerarDesdeHoy(config);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Turnos regenerados correctamente",
                    "turnos_regenerados", generados
            ));

        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    // ============================================================
    // REGENERAR TURNOS DE UN DÍA ESPECÍFICO
    // ============================================================
    @Operation(
            summary = "Regenerar turnos de un día",
            description = "Elimina los turnos disponibles del día indicado y los vuelve a generar según la configuración horaria del médico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turnos regenerados correctamente"),
            @ApiResponse(responseCode = "404", description = "Configuración no encontrada")
    })
    @PostMapping("/{id}/regenerar-dia")
    public ResponseEntity<?> regenerarDia(
            @PathVariable Long id,
            @Parameter(description = "Fecha en formato yyyy-MM-dd", example = "2026-02-14")
            @RequestParam LocalDate fecha) {

        try {
            ConfiguracionHorariaMedico config = configuracionService.obtenerPorId(id);

            int generados = agendaService.regenerarDia(config, fecha);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Turnos regenerados para el día indicado",
                    "fecha", fecha,
                    "turnos_regenerados", generados
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    // ============================================================
    // REGENERAR TURNOS MANUALMENTE EN UN RANGO
    // ============================================================
    @Operation(
            summary = "Regenerar turnos en un rango de fechas",
            description = "Elimina los turnos disponibles dentro del rango indicado y los vuelve a generar según la configuración horaria del médico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Turnos regenerados correctamente"),
            @ApiResponse(responseCode = "404", description = "Configuración no encontrada")
    })
    @PostMapping("/{id}/regenerar-rango")
    public ResponseEntity<?> regenerarRango(
            @PathVariable Long id,
            @Parameter(description = "Fecha de inicio en formato yyyy-MM-dd", example = "2026-02-14")
            @RequestParam LocalDate inicio,
            @Parameter(description = "Fecha de fin en formato yyyy-MM-dd", example = "2026-03-14")
            @RequestParam LocalDate fin) {
        try {
            ConfiguracionHorariaMedico config = configuracionService.obtenerPorId(id);

            int generados = agendaService.regenerarRango(config, inicio, fin);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Turnos regenerados en el rango indicado",
                    "desde", inicio,
                    "hasta", fin,
                    "turnos_regenerados", generados
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }
}
