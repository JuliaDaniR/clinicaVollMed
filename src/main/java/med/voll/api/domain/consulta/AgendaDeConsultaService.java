package med.voll.api.domain.consulta;

import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.paciente.Paciente;
import med.voll.api.infra.errores.ValidacionIntegridad;
import med.voll.api.repository.IConsultaRepository;
import med.voll.api.repository.IMedicoRepository;
import med.voll.api.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AgendaDeConsultaService {
    @Autowired
    private IConsultaRepository consultaRepo;
    @Autowired
    private IMedicoRepository medicoRepo;
    @Autowired
    private IPacienteRepository pacienteRepo;

    public void agendar(DatosAgendarConsulta datosAgendarConsulta){

        var paciente = new Paciente();
        var pacienteOptional = pacienteRepo.findById(datosAgendarConsulta.idPaciente());

        if(pacienteOptional.isPresent()){
           paciente = pacienteOptional.get();
        }else{
            throw new ValidacionIntegridad("No se encontró ningún paciente con ese id");
        }

        var medico = new Medico();
        var medicoOptional = medicoRepo.findById(datosAgendarConsulta.idMedico());

        if(datosAgendarConsulta.idMedico() != null && medicoRepo.existsById(datosAgendarConsulta.idMedico())){
            medico = seleccionarMedico(datosAgendarConsulta);
        }else {
            throw new ValidacionIntegridad("No se encontró ningún médico con ese id");
        }


        Consulta consulta = new Consulta(null,medico, paciente,datosAgendarConsulta.fecha());

        consultaRepo.save(consulta);
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
