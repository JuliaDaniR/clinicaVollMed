package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.repository.IConsultaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component("ValidadorHorarioAntecedenciaCancelamiento")
public class ValidadorHorarioAntecedencia implements ValidadorCancelamientoDeConsulta {

    @Autowired
    private IConsultaRepository consultaRepo;

    @Override
    public void validar(DatosCancelamientoConsulta datos){
        var consulta = consultaRepo.getReferenceById(datos.idConsulta());
        var ahora = LocalDateTime.now();
        var diferenciaEnHoras = Duration.between(ahora,consulta.getFecha()).toHours();

        if(diferenciaEnHoras < 24){
            throw new ValidationException("La consulta solo puede ser cancelada con mas de 24hs de anticipacion");
        }
    }
}
