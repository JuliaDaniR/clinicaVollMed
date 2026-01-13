package med.voll.api.domain.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import med.voll.api.domain.usuarios.model.enumerator.RolEntrada;

public record DatosRegistroUsuario(
        @Email
        String email,
        @NotNull
        String clave,
        String nombre,
        String telefono,
        String dni,
        RolEntrada rol) {
}
