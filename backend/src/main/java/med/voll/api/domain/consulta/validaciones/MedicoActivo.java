package med.voll.api.domain.consulta.validaciones;

import jakarta.validation.ValidationException;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.medico.repository.MedicoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MedicoActivo implements ValidadorDeConsultas {

    @Autowired
    private MedicoRepository medicoRepo;

    public void validar(DatosValidacionConsulta datos) {

        if (datos.idMedico() == null) return;

        boolean activo = medicoRepo.findActivoById(datos.idMedico());

        if (!activo) {
            throw new ValidationException("No se pueden agendar consultas con médicos inactivos");
        }
    }
}
