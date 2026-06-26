package med.voll.api.domain.paciente.dto;

import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.familiar.model.Parentesco;
import java.time.LocalDate;

public record DatosListadoPaciente(
        Long id,
        String nombre,
        String email,
        String telefono,
        String dni,
        Boolean activo,
        LocalDate fechaNacimiento,
        Boolean esDependiente,
        Parentesco parentesco
) {
    public DatosListadoPaciente(Paciente p) {
        this(
                p.getId(),
                p.getNombre(),
                p.getEmail(),
                p.getTelefono(),
                p.getDni(),
                p.getActivo(),
                p.getFechaNacimiento(),
                p.esDependiente(),
                p.getVinculoFamiliar() != null ? p.getVinculoFamiliar().getParentesco() : null
        );
    }
}
