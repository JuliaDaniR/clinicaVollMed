package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.DatosAgendarConsulta;
import med.voll.api.repository.IConsultaRepository;
import med.voll.api.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PacienteSinConsulta implements ValidadorDeConsultas{
    @Autowired
    private IConsultaRepository consultaRepo;

    public void validar(DatosAgendarConsulta datos) {

        var primerHorario = datos.fecha().withHour(7).withMinute(0).withSecond(0).withNano(0);
        var ultimoHorario = datos.fecha().withHour(18).withMinute(0).withSecond(0).withNano(0);

        var pacienteConConsulta = consultaRepo.existsByPacienteIdAndFechaBetween(datos.idPaciente(), primerHorario, ultimoHorario);

        if (pacienteConConsulta) {
            throw new ValidationException("El paciente ya tiene una consulta para ese dia");
        }
    }
}
