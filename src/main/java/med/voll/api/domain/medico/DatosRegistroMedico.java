package med.voll.api.domain.medico;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import med.voll.api.domain.direccion.DatosDireccion;

public record DatosRegistroMedico(

        @NotBlank(message = "Nombre es obligatorio")
        String nombre,
        @NotBlank(message = "Email es obligatorio")
        @Email(message = "Formato de email es inválido")
        String email,
        @NotBlank(message = "Teléfono es obligatorio")
        String telefono,
        @NotBlank(message = "Documento es obligatorio")
        @Pattern(regexp = "\\d{4,8}", message = "Formato del documento es inválido")
        String documento,
        @NotNull(message = "Especialidad es obligatorio")
        Especialidad especialidad,
        @NotNull(message = "Datos de dirección son obligatorios")
        @Valid
        DatosDireccion direccion) {
        public static record DatosActualizarMedico(@NotNull Long id, String nombre, String documento, DatosDireccion direccion) {
    }
}
