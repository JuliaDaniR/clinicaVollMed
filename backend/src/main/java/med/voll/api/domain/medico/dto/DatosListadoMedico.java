package med.voll.api.domain.medico.dto;

import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.model.enumerator.Especialidad;

public record DatosListadoMedico(
        Long id,
        String nombre,
        String email,
        String matricula,
        Especialidad especialidad,
        Boolean activo
) {
    public DatosListadoMedico(Medico m) {
        this(
                m.getId(),
                m.getNombre(),
                m.getEmail(),
                m.getMatricula(),
                m.getEspecialidad(),
                m.getActivo()
        );
    }
}

