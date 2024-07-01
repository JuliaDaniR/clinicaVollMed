package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.DatosAgendarConsulta;
import med.voll.api.repository.IMedicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MedicoActivo implements ValidadorDeConsultas{
    
    @Autowired
    private IMedicoRepository medicoRepo;

    public void validar(DatosAgendarConsulta datos){

        if (datos.idMedico() == null){
            return;
        }
        var medicoActivo = medicoRepo.findActivoById(datos.idMedico());

        if(!medicoActivo){
            throw new ValidationException("No se pueden permitir agendar citas con medicos inactivos");
        }
    }
}
