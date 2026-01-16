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
import med.voll.api.infra.errores.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
