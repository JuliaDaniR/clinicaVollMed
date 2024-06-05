package med.voll.api.domain.consulta;

import med.voll.api.domain.consulta.desafio.DatosCancelamientoConsulta;
import med.voll.api.domain.consulta.desafio.ValidadorCancelamientoDeConsulta;
import med.voll.api.domain.consulta.validaciones.ValidadorDeConsultas;
import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.paciente.Paciente;
import med.voll.api.infra.errores.ValidacionIntegridad;
import med.voll.api.repository.IConsultaRepository;
import med.voll.api.repository.IMedicoRepository;
import med.voll.api.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AgendaDeConsultaService {
    @Autowired
    private IConsultaRepository consultaRepo;
    @Autowired
    private IMedicoRepository medicoRepo;
    @Autowired
    private IPacienteRepository pacienteRepo;
    @Autowired
    List<ValidadorDeConsultas> validadores;

    @Autowired
    List<ValidadorCancelamientoDeConsulta> validadoresCancelamiento;

    public DatosDetalleConsulta agendar(DatosAgendarConsulta datos){

        System.out.println("******************La fecha es" +datos.fecha());
        if(!pacienteRepo.findById(datos.idPaciente()).isPresent()){
            throw new ValidacionIntegridad("Este id para el paciente no fue encontrado");
        }

        if(datos.idMedico()!=null && !medicoRepo.existsById(datos.idMedico())){
            throw new ValidacionIntegridad("Este id para el medico no fue encontrado");
        }

        validadores.forEach(v-> v.validar(datos));

        var paciente = pacienteRepo.findById(datos.idPaciente()).get();

        var medico = seleccionarMedico(datos);

        if(medico==null){
            throw new ValidacionIntegridad("No existen medicos disponibles para este horario y especialidad");
        }

        var consulta = new Consulta(medico,paciente,datos.fecha());

        consultaRepo.save(consulta);

        return new DatosDetalleConsulta(consulta);

    }

    public void cancelar(DatosCancelamientoConsulta datos){
        if(!consultaRepo.existsById(datos.idConsulta())){
            throw new ValidacionIntegridad("Id de la consulta no existe");
        }

        validadoresCancelamiento.forEach(v->v.validar(datos));

        var consulta = consultaRepo.getReferenceById(datos.idConsulta());
        consulta.cancelar(datos.motivo());
    }

    private Medico seleccionarMedico(DatosAgendarConsulta datosAgendarConsulta) {

        if(datosAgendarConsulta.idMedico()!=null){
            return medicoRepo.getReferenceById(datosAgendarConsulta.idMedico());
        }
        if(datosAgendarConsulta.especialidad()==null){
            throw new ValidacionIntegridad("Debe seleccionarse una especialidad");
        }
        return medicoRepo.seleccionarMedicoPorEspecialidadEnFecha(datosAgendarConsulta.especialidad(),datosAgendarConsulta.fecha());
    }

    //Primer cambio en intellj
}
