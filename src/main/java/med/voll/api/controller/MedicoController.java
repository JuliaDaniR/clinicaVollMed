package med.voll.api.controller;
// Query para eliminar migracion en caso de haberme olvidado de parar el programa
// DELETE FROM flyway_schema_history WHERE version = '1';(cambiar por el numero de version)
// delete from flyway_schema_history where success = 0;(o esta para eliminar la que ocurrio el error)

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.medico.DatosListadoMedico;
import med.voll.api.domain.medico.DatosRegistroMedico;
import med.voll.api.domain.medico.DatosRespuestaMedico;
import med.voll.api.domain.medico.Medico;
import med.voll.api.repository.IMedicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/medicos")
public class MedicoController {

    @Autowired
    private IMedicoRepository medicoRepo;

    @PostMapping
    public ResponseEntity<DatosRespuestaMedico> registrarMedico(@RequestBody @Valid DatosRegistroMedico datosRegistroMedico, UriComponentsBuilder uriComponentsBuilder) {

        Medico medico = medicoRepo.save(new Medico(datosRegistroMedico));
        //El metodo post debe return 201 Ceated
        //Retornar la url donde encontrar al medico

        //Es buena practica utilizar un dto para no retornar la entidad medico
        DatosRespuestaMedico datosRespuestaMedico = new DatosRespuestaMedico(medico.getId(),
                medico.getNombre(),
                medico.getEmail(),
                medico.getTelefono(),
                medico.getDocumento(),
                medico.getEspecialidad().toString(),
                new DatosDireccion(
                        medico.getDireccion().getCalle(),
                        medico.getDireccion().getDistrito(),
                        medico.getDireccion().getCiudad(),
                        medico.getDireccion().getNumero(),
                        medico.getDireccion().getComplemento()));

        //Crear la url dinamicamente donde el recurso va a ser encontrado
        URI url = uriComponentsBuilder.path("/medicos/{id}").buildAndExpand(medico.getId()).toUri();

        return ResponseEntity.created(url).body(datosRespuestaMedico);

    }

    @GetMapping                                                   //se utiliza para definir valores por defecto
    public ResponseEntity<Page<DatosListadoMedico>> listarMedicos(@PageableDefault(size = 3) Pageable paginacion) {

        //return medicoRepo.findAll(paginacion).map(DatosListadoMedico::new);
        return ResponseEntity.ok().body(medicoRepo.findByActivoTrue(paginacion).map(DatosListadoMedico::new));
    }

    @PutMapping
    @Transactional
    public ResponseEntity actualizarMedicos(@RequestBody @Valid DatosRegistroMedico.DatosActualizarMedico datosActualizarMedico) {
        Medico medico = medicoRepo.getReferenceById(datosActualizarMedico.id());
        medico.actualizarDatos(datosActualizarMedico);

        return ResponseEntity.ok(new DatosRespuestaMedico(
                medico.getId(),
                medico.getNombre(),
                medico.getEmail(),
                medico.getTelefono(),
                medico.getDocumento(),
                medico.getEspecialidad().toString(),
                new DatosDireccion(
                        medico.getDireccion().getCalle(),
                        medico.getDireccion().getDistrito(),
                        medico.getDireccion().getCiudad(),
                        medico.getDireccion().getNumero(),
                        medico.getDireccion().getComplemento())));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity eliminarMedico(@PathVariable Long id) {
        Medico medico = medicoRepo.getReferenceById(id);
        medico.desactivarMedico();

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DatosRespuestaMedico> retornarDatosMedicos(@PathVariable Long id) {

        Medico medico = medicoRepo.getReferenceById(id);

        var datosMedicos = new DatosRespuestaMedico(
                medico.getId(),
                medico.getNombre(),
                medico.getEmail(),
                medico.getTelefono(),
                medico.getDocumento(),
                medico.getEspecialidad().toString(),
                new DatosDireccion(
                        medico.getDireccion().getCalle(),
                        medico.getDireccion().getDistrito(),
                        medico.getDireccion().getCiudad(),
                        medico.getDireccion().getNumero(),
                        medico.getDireccion().getComplemento()));

        return ResponseEntity.ok(datosMedicos);
    }
}


//Por lo tanto, en solicitudes que usen paginación,
// debemos usar estos nombres que fueron definidos.
// Por ejemplo, para listar los médicos de nuestra API trayendo solo 5 registros de la página 2,
// ordenados por email y en orden descendente, la URL de solicitud debe ser:
//http://localhost:8080/medicos?tamano=5&pagina=1&orden=email,desc