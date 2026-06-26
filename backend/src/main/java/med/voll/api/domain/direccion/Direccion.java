package med.voll.api.domain.direccion;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Direccion {

    private String calle;
    private String ciudad;
    private String numero;
    private String provincia;
    private String pais;

    public Direccion(DatosDireccion direccion) {
        this.calle = direccion.calle();
        this.ciudad = direccion.ciudad();
        this.numero = direccion.numero();
        this.provincia = direccion.provincia();
        this.pais = direccion.pais();
    }

    public Direccion actualizarDatos(DatosDireccion direccion) {
        this.calle = direccion.calle();
        this.ciudad = direccion.ciudad();
        this.numero = direccion.numero();
        this.provincia = direccion.provincia();
        this.pais = direccion.pais();
        return this;
    }
}
