package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import med.voll.api.domain.ia.dto.DatosRespuestaAsistenciaDTO;
import med.voll.api.domain.ia.dto.DatosSolicitudAsistenciaDTO;
import med.voll.api.domain.ia.service.IAService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ia")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-key")
@Tag(name = "Asistente IA", description = "Servicios asistidos por inteligencia artificial para redactar notas de evolución y recetas médicas.")
public class IAController {

    private final IAService iaService;

    @PostMapping("/asistir-nota")
    @Operation(summary = "Asistir redacción de nota de evolución", description = "Expande ideas breves del médico a una nota formal y estructurada en formato SOAP.")
    public ResponseEntity<DatosRespuestaAsistenciaDTO> asistirNota(
            @RequestBody @Valid DatosSolicitudAsistenciaDTO dto) {
        DatosRespuestaAsistenciaDTO respuesta = iaService.asistirNota(dto.texto());
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/asistir-receta")
    @Operation(summary = "Asistir redacción de receta médica", description = "Estructura indicaciones de medicamentos a un plan de tratamiento paciente legible.")
    public ResponseEntity<DatosRespuestaAsistenciaDTO> asistirReceta(
            @RequestBody @Valid DatosSolicitudAsistenciaDTO dto) {
        DatosRespuestaAsistenciaDTO respuesta = iaService.asistirReceta(dto.texto());
        return ResponseEntity.ok(respuesta);
    }
}
