package med.voll.api.domain.usuarios.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;

public record DatosAutenticacionUsuario(
        @Email
        String email ,
         @JsonAlias({"password","contraseña"})String clave) {
}
