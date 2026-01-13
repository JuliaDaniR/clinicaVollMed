package med.voll.api.domain.medico.dto;

import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.medico.model.enumerator.Especialidad;

import java.time.LocalDate;

public record DatosRespuestaMedico(
        Long id,

        // Datos del usuario
        String nombre,
        String email,
        String telefono,
        String dni,

        // Datos propios del médico
        String matricula,
        Especialidad especialidad,
        Boolean activo,
        LocalDate fechaAlta
) {

    public DatosRespuestaMedico(Medico medico) {
        this(
                medico.getId(),
                medico.getUsuario().getNombre(),
                medico.getUsuario().getEmail(),
                medico.getUsuario().getTelefono(),
                medico.getUsuario().getDni(),

                medico.getMatricula(),
                medico.getEspecialidad(),

                medico.getActivo(),
                medico.getFechaAlta()
        );
    }
}
