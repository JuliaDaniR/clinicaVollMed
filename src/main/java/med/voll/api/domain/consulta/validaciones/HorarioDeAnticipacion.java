package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class HorarioDeAnticipacion implements ValidadorDeConsultas {

    public void validar(DatosValidacionConsulta datos) {

        var ahora = LocalDateTime.now();
        var diferencia = Duration.between(ahora, datos.fecha()).toMinutes();

        if (diferencia < 30) {
            throw new ValidationException(
                    "Las consultas deben programarse con al menos 30 minutos de anticipación");
        }
    }
}
