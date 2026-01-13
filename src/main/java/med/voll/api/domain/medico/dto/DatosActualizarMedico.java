package med.voll.api.domain.medico.dto;

import jakarta.validation.constraints.NotNull;
import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.medico.model.enumerator.Especialidad;

public record DatosActualizarMedico(

        @NotNull(message = "El ID es obligatorio")
        Long id,
        String matricula,
        Especialidad especialidad,
        DatosDireccion direccion
) {}