package med.voll.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import med.voll.api.domain.consulta.AgendaDeConsultaService;
import med.voll.api.domain.consulta.Consulta;
import med.voll.api.domain.consulta.DatosAgendarConsulta;
import med.voll.api.domain.consulta.DatosDetalleConsulta;
import med.voll.api.domain.consulta.desafio.DatosCancelamientoConsulta;
import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.paciente.Paciente;
import med.voll.api.infra.errores.ValidacionIntegridad;
import med.voll.api.repository.IConsultaRepository;
import med.voll.api.repository.IMedicoRepository;
import med.voll.api.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@ResponseBody
@RequestMapping("/consultas")
@SecurityRequirement(name = "bearer-key")
public class ConsultaController {

    @Autowired
    private AgendaDeConsultaService agendaDeConsultaService;

    @Autowired
    private IConsultaRepository consultaRepo;

    @Autowired
    private IMedicoRepository medicoRepo;

    @Autowired
    private IPacienteRepository pacienteRepo;

    @PostMapping
    @Transactional
    @Operation(
            summary = "registra una consulta en la base de datos",
            description = "",
            tags = {"consulta", "post"}
    )
    public ResponseEntity agendar(@RequestBody @Valid DatosAgendarConsulta datos) throws ValidacionIntegridad {

        var response = agendaDeConsultaService.agendar(datos);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    @Transactional
    @Operation(
            summary = "Cancelar una consulta de la agenda",
            description = "requiere motivo",
            tags = {"consulta", "delete"}
    )
    public ResponseEntity<String> cancelar(@RequestBody @Valid DatosCancelamientoConsulta datos) {
        agendaDeConsultaService.cancelar(datos);
        return ResponseEntity.ok("La consulta fue cancelada exitósamente");
    }

    @PutMapping
    @Transactional
    public ResponseEntity<DatosDetalleConsulta> actualizar(@RequestBody @Valid DatosAgendarConsulta.DatosActualizarConsulta datos) {
        var consulta = consultaRepo.getReferenceById(datos.id());
        Medico medico = medicoRepo.getReferenceById(datos.idMedico());
        Paciente paciente = pacienteRepo.getReferenceById(datos.idPaciente());
        consulta.actualizarInformacion(datos, medico, paciente);

        return ResponseEntity.ok(new DatosDetalleConsulta(consulta));
    }

}
