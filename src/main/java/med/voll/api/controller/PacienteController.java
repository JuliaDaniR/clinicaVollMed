package med.voll.api.controller;

import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.medico.DatosListadoMedico;
import med.voll.api.domain.medico.DatosRegistroMedico;
import med.voll.api.domain.medico.DatosRespuestaMedico;
import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.paciente.DatosActualizacionPaciente;
import med.voll.api.domain.paciente.DatosListadoPaciente;
import med.voll.api.domain.paciente.DatosDetalladoPaciente;
import med.voll.api.domain.paciente.Paciente;
import med.voll.api.domain.paciente.DatosRegistroPaciente;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import med.voll.api.repository.IMedicoRepository;
import med.voll.api.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("pacientes")
public class PacienteController {

    @Autowired
    private IPacienteRepository repository;

    @PostMapping
    @Transactional
    public ResponseEntity<DatosDetalladoPaciente> registrar(@RequestBody @Valid DatosRegistroPaciente datos, UriComponentsBuilder uriBuilder) {
        var paciente = repository.save(new Paciente(datos));

        DatosDetalladoPaciente datosDetalladoPaciente = new DatosDetalladoPaciente(paciente);

        var uri = uriBuilder.path("/pacientes/{id}").buildAndExpand(paciente.getId()).toUri();
        return ResponseEntity.created(uri).body(datosDetalladoPaciente);
    }

    @GetMapping
    public ResponseEntity<Page<DatosListadoPaciente>> listar(@PageableDefault(size = 3) Pageable paginacion) {
        var page = repository.findAllByActivoTrue(paginacion).map(DatosListadoPaciente::new);
        return ResponseEntity.ok(page);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<DatosDetalladoPaciente> actualizar(@RequestBody @Valid DatosRegistroPaciente.DatosActualizarPaciente datos) {
        var paciente = repository.getReferenceById(datos.id());
        paciente.actualizarInformacion(datos);

        return ResponseEntity.ok(new DatosDetalladoPaciente(paciente));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<DatosDetalladoPaciente> eliminar(@PathVariable Long id) {
        var paciente = repository.getReferenceById(id);
        paciente.eliminar();

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity detallar(@PathVariable Long id) {
        var paciente = repository.getReferenceById(id);
        return ResponseEntity.ok(new DatosDetalladoPaciente(paciente));
    }
}