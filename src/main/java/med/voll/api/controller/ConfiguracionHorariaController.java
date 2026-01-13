package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.horario.dto.ConfiguracionHorariaDTO;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.service.AgendaGeneratorService;
import med.voll.api.domain.horario.service.ConfiguracionHorariaMedicoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
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

            return ResponseEntity.created(uri).body(Map.of(
                    "status", "success",
                    "message", "Configuración creada correctamente",
                    "data", config
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
            ConfiguracionHorariaMedico config = configuracionService.actualizarConfiguracion(id, dto);

            int regenerados = agendaService.regenerarDesdeHoy(config);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Configuración actualizada y turnos regenerados",
                    "turnos_generados", regenerados,
                    "data", config
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
    @Operation(
            summary = "Listar configuraciones de un médico",
            description = "Obtiene todas las configuraciones horarias activas e inactivas del médico."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado obtenido correctamente")
    })
    @GetMapping("/medico/{medicoId}")
    public ResponseEntity<?> listarPorMedico(@PathVariable Long medicoId) {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "data", configuracionService.listarPorMedico(medicoId)
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
}
