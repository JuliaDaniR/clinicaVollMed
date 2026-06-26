package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.paciente.repository.IPacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PacienteActivo implements ValidadorDeConsultas {

    @Autowired
    private IPacienteRepository pacienteRepo;

    public void validar(DatosValidacionConsulta datos) {

        if (datos.idPaciente() == null) return;

        boolean activo = pacienteRepo.findActivoById(datos.idPaciente());

        if (!activo) {
            throw new ValidationException("No se pueden agendar consultas con pacientes inactivos");
        }
    }
}


