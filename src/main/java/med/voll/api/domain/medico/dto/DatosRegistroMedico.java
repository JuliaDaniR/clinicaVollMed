package med.voll.api.domain.medico.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.medico.model.enumerator.Especialidad;

public record DatosRegistroMedico(

        @NotBlank(message = "Nombre es obligatorio")
        String nombre,

        @NotBlank(message = "Email es obligatorio")
        @Email(message = "Formato de email inválido")
        String email,

        @NotBlank(message = "Clave es obligatoria")
        String clave,

        @NotBlank(message = "Teléfono es obligatorio")
        String telefono,

        @NotBlank(message = "Documento es obligatorio")
        String dni,

        @NotBlank(message = "Matrícula es obligatoria")
        String matricula,

        @NotNull(message = "Especialidad es obligatoria")
        Especialidad especialidad,

        @NotNull(message = "La dirección es obligatoria")
        @Valid
        DatosDireccion direccion
) {}

