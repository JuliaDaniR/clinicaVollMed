package med.voll.api.domain.usuarios;

import com.fasterxml.jackson.annotation.JsonAlias;

public record DatosAutenticacionUsuario(
        String login ,
         @JsonAlias({"password","contraseña"})String clave) {
}
