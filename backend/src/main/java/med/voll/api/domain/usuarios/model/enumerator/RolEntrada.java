package med.voll.api.domain.usuarios.model.enumerator;

import med.voll.api.domain.usuarios.model.Rol;

public enum RolEntrada {
    ADMIN,
    RECEPCIONISTA,
    MEDICO,
    PACIENTE;

    public Rol.NombreRol toNombreRol() {
        return Rol.NombreRol.valueOf("ROLE_" + this.name());
    }
}
