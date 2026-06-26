package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.repository.IConsultaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PacienteSinConsulta implements ValidadorDeConsultas {

    @Autowired
    private IConsultaRepository consultaRepo;

    public void validar(DatosValidacionConsulta datos) {

        LocalDateTime fecha = datos.fecha();

        var inicio = fecha.withHour(7).withMinute(0).withSecond(0).withNano(0);
        var fin = fecha.withHour(18).withMinute(0).withSecond(0).withNano(0);

        boolean existe = consultaRepo.existsByPacienteIdAndFechaBetween(
                datos.idPaciente(), inicio, fin
        );

        if (existe) {
            throw new ValidationException("El paciente ya tiene una consulta en ese día");
        }
    }
}
