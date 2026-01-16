package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
@Component
public class HorarioDeFuncionamientoClinica implements ValidadorDeConsultas {

    public void validar(DatosValidacionConsulta datos) {

        var fecha = datos.fecha();
        var domingo = fecha.getDayOfWeek().equals(DayOfWeek.SUNDAY);

        var antes = fecha.getHour() < 7;
        var despues = fecha.getHour() > 18;

        if (domingo || antes || despues) {
            throw new ValidationException(
                    "El horario de atención de la clínica es de lunes a sábado de 07:00 a 19:00 hs");
        }
    }
}
