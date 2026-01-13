package med.voll.api.domain.medico.model.enumerator;

public enum Especialidad {

    ORTOPEDIA(30),
    CARDIOLOGIA(20),
    GINECOLOGIA(30),
    PEDIATRIA(20),
    DERMATOLOGIA(20),
    PSICOLOGIA(45),
    ODONTOLOGIA(30),
    NEUROLOGIA(30),
    CLINICA_MEDICA(20),
    TRAUMATOLOGIA(30),
    NUTRICION(40),
    OTORRINOLARINGOLOGIA(20),
    UROLOGIA(30),
    OFTALMOLOGIA(20);

    private final int duracionMinutos;

    Especialidad(int duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    public int getDuracionMinutos() {
        return duracionMinutos;
    }
}
