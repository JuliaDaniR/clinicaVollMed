package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class ConsultaController {

    private final AgendaDeConsultaService consultaService;

    // ==========================================================
    // AGENDAR
    // ==========================================================
    @Operation(
            summary = "Agendar nueva consulta",
            description = "Crea una consulta validando médico, paciente, horarios y reglas clínicas.",
            tags = {"Consultas"}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Consulta creada"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Paciente o médico no encontrado")
    })
    @PostMapping
    public ResponseEntity<ApiResponseDTO> agendar(@RequestBody @Valid DatosAgendarConsulta dto) {
        ApiResponseDTO respuesta = consultaService.agendarConsulta(dto);
        return ResponseEntity.status(respuesta.status()).body(respuesta);
    }

    // ==========================================================
    // CANCELAR
    // ==========================================================
    @Operation(
            summary = "Cancelar consulta",
            description = "Cancela una consulta existente con un motivo.",
            tags = {"Consultas"}
    )
    @DeleteMapping
    public ResponseEntity<ApiResponseDTO> cancelar(@RequestBody @Valid DatosCancelamientoConsulta dto) {
        ApiResponseDTO resp = consultaService.cancelarConsulta(dto);
        return ResponseEntity.status(resp.status()).body(resp);
    }

    // ==========================================================
    // ACTUALIZAR
    // ==========================================================
    @Operation(
            summary = "Actualizar consulta",
            tags = {"Consultas"}
    )
    @PutMapping
    public ResponseEntity<ApiResponseDTO> actualizar(@RequestBody @Valid DatosAgendarConsulta.DatosActualizarConsulta dto) {
        ApiResponseDTO resp = consultaService.actualizarConsulta(dto);
        return ResponseEntity.status(resp.status()).body(resp);
    }
}
