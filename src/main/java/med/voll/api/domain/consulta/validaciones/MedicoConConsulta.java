package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.DatosAgendarConsulta;
import med.voll.api.repository.IConsultaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MedicoConConsulta implements ValidadorDeConsultas{
    @Autowired
    private IConsultaRepository consultaRepo;

    public void validar(DatosAgendarConsulta datos){
        if(datos.idMedico()==null){
            return;
        }

        var medicoConConsulta = consultaRepo.existsByMedicoIdAndFecha(datos.idMedico(),datos.fecha());

        if(medicoConConsulta){
            throw new ValidationException("Este medico ya tiene una consulta en ese horario");
        }
    }
}
