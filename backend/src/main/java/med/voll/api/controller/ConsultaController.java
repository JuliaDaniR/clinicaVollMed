package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.consulta.dto.DatosReprogramarConsulta;
import med.voll.api.domain.consulta.service.AgendaDeConsultaService;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.consulta.validaciones.DatosCancelamientoConsulta;
import med.voll.api.domain.consulta.dto.DatosListadoConsultaDTO;
import med.voll.api.domain.consulta.dto.DatosPropuestaReprogramacionDTO;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/consultas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(
        name = "Consultas",
        description = "Gestión completa de consultas médicas: agendamiento, cancelación y reprogramación."
)
public class ConsultaController {

    private final AgendaDeConsultaService consultaService;

    // ====================== AGENDAR ===============================
    @Operation(
            summary = "Agendar una consulta",
            description = """
                    Crea una nueva consulta médica a partir de un turno disponible.
                    - El turno seleccionado se marca automáticamente como **RESERVADO**.
                    - La consulta queda vinculada al médico y paciente correspondientes.
                    - Reglas clínicas y de horario se validan según configuración del médico.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Consulta agendada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos o turno no disponible"),
            @ApiResponse(responseCode = "404", description = "Paciente o turno no encontrado")
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO> agendar(
            @RequestBody @Valid DatosAgendarConsulta dto) {

        var resp = consultaService.agendarConsulta(dto);
        return ResponseEntity.status(resp.status()).body(resp);
    }


    // ====================== CANCELAR ==============================
    @Operation(
            summary = "Cancelar una consulta",
            description = """
                    Cancela una consulta médica ya registrada.
                    - El turno asociado vuelve automáticamente a estado **DISPONIBLE**.
                    - Se registra el motivo clínico o administrativo del cancelamiento.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Consulta cancelada"),
            @ApiResponse(responseCode = "404", description = "Consulta no encontrada")
    })
    @DeleteMapping
    public ResponseEntity<ApiResponseDTO> cancelar(
            @RequestBody @Valid DatosCancelamientoConsulta dto) {

        var resp = consultaService.cancelarConsulta(dto);
        return ResponseEntity.status(resp.status()).body(resp);
    }


    // ====================== REPROGRAMAR ===========================
    @Operation(
            summary = "Reprogramar una consulta",
            description = """
                    Permite mover una consulta a un nuevo turno disponible.
                    - Se libera el turno anterior.
                    - Se reserva el nuevo turno.
                    - Mantiene datos clínicos de la consulta original (motivo, médico, paciente).
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Consulta reprogramada correctamente"),
            @ApiResponse(responseCode = "400", description = "El nuevo turno no está disponible"),
            @ApiResponse(responseCode = "404", description = "Consulta o turno no encontrado")
    })
    @PutMapping("/reprogramar")
    public ResponseEntity<ApiResponseDTO> reprogramar(
            @RequestBody @Valid DatosReprogramarConsulta dto) {

        var resp = consultaService.reprogramarConsulta(dto);
        return ResponseEntity.status(resp.status()).body(resp);
    }

    // ====================== BUSCAR / LISTAR =======================
    @Operation(
            summary = "Buscar/listar consultas agendadas",
            description = "Obtiene la lista de consultas agendadas de acuerdo al rol del usuario autenticado."
    )
    @GetMapping
    public ResponseEntity<List<DatosListadoConsultaDTO>> buscarConsultas(
            @AuthenticationPrincipal Usuario auth) {
        var lista = consultaService.listarConsultas(auth);
        return ResponseEntity.ok(lista);
    }

    // ====================== PROPONER REPROGRAMACIÓN ==============
    @Operation(
            summary = "Proponer reprogramación de consulta",
            description = "El médico propone una fecha y hora alternativa para la consulta."
    )
    @PutMapping("/{id}/proponer-reprogramacion")
    public ResponseEntity<ApiResponseDTO> proponerReprogramacion(
            @PathVariable Long id,
            @RequestBody @Valid DatosPropuestaReprogramacionDTO dto) {
        var resp = consultaService.proponerReprogramacion(id, dto);
        return ResponseEntity.status(resp.status()).body(resp);
    }

    // ====================== ACEPTAR REPROGRAMACIÓN =================
    @Operation(
            summary = "Aceptar propuesta de reprogramación",
            description = "El paciente acepta el nuevo horario propuesto por el médico."
    )
    @PutMapping("/{id}/aceptar-reprogramacion")
    public ResponseEntity<ApiResponseDTO> aceptarReprogramacion(@PathVariable Long id) {
        var resp = consultaService.aceptarReprogramacion(id);
        return ResponseEntity.status(resp.status()).body(resp);
    }

    // ====================== RECHAZAR Y MANTENER ===================
    @Operation(
            summary = "Rechazar propuesta y mantener original",
            description = "El paciente rechaza la propuesta del médico y prefiere mantener el horario original."
    )
    @PutMapping("/{id}/rechazar-reprogramacion-mantener")
    public ResponseEntity<ApiResponseDTO> rechazarReprogramacionMantener(@PathVariable Long id) {
        var resp = consultaService.rechazarReprogramacionMantener(id);
        return ResponseEntity.status(resp.status()).body(resp);
    }

    // ====================== RECHAZAR Y CANCELAR ===================
    @Operation(
            summary = "Rechazar propuesta y cancelar cita",
            description = "El paciente rechaza la propuesta del médico y decide cancelar la cita."
    )
    @PutMapping("/{id}/rechazar-reprogramacion-cancelar")
    public ResponseEntity<ApiResponseDTO> rechazarReprogramacionCancelar(@PathVariable Long id) {
        var resp = consultaService.rechazarReprogramacionCancelar(id);
        return ResponseEntity.status(resp.status()).body(resp);
    }
}
