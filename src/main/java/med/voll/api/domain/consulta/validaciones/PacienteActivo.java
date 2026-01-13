package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PacienteActivo implements ValidadorDeConsultas{
    @Autowired
    private IPacienteRepository pacienteRepo;

    public void validar(DatosAgendarConsulta datos){

        if (datos.idPaciente() == null){
            return;
        }

        var pacienteActivo = pacienteRepo.findActivoById(datos.idPaciente());

        if(!pacienteActivo){
            throw new ValidationException("No se pueden permitir agendar citas con pacientes inactivos");
        }
    }
}
