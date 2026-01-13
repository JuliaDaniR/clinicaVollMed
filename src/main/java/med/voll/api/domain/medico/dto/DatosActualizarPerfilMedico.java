package med.voll.api.domain.medico.dto;

import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.medico.model.enumerator.Especialidad;

public record DatosActualizarPerfilMedico(

        // Datos del usuario
        String nombre,
        String telefono,
        String dni,

        // Datos del médico
        String matricula,
        Especialidad especialidad,
        DatosDireccion direccion
) {}

