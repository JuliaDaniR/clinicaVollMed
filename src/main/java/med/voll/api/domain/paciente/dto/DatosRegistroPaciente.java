package med.voll.api.domain.paciente.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import med.voll.api.domain.direccion.DatosDireccion;

public record DatosRegistroPaciente(

        @NotBlank(message = "Nombre es obligatorio")
        String nombre,
        @NotBlank(message = "Email es obligatorio")
        @Email(message = "Formato de email es inválido")
        String email,

        String clave,
        @NotBlank(message = "Teléfono es obligatorio")
        String telefono,

        @NotBlank(message = "Documento es obligatorio")
        @Pattern(regexp = "\\d{4,8}", message = "Formato del documento es inválido")
        String dni,
        @NotNull(message = "Datos de dirección son obligatorios")
        @Valid
        DatosDireccion direccion) {
    
    public static record DatosActualizarPaciente(@NotNull Long id, String nombre, String documentoIdentidad,
                                                 DatosDireccion direccion, String telefono) {
    }
}