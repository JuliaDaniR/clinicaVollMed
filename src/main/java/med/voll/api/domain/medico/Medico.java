package med.voll.api.domain.medico;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.direccion.Direccion;

@Entity(name = "Medico")
@Table(name = "medicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Medico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    private String nombre;
    private String email;
    private String telefono;
    private String documento;
    private Boolean activo;

    @Enumerated(EnumType.STRING)
    private Especialidad especialidad;
    @Embedded
    private Direccion direccion;

    public Medico(DatosRegistroMedico datosRegistroMedico) {
        this.activo = true;
        this.nombre = datosRegistroMedico.nombre();
        this.email = datosRegistroMedico.email();
        this.telefono = datosRegistroMedico.telefono();
        this.documento = datosRegistroMedico.documento();
        this.especialidad = datosRegistroMedico.especialidad();
        this.direccion = new Direccion(datosRegistroMedico.direccion());
    }

    public void actualizarDatos(DatosRegistroMedico.DatosActualizarMedico datosActualizarMedico) {
       if (datosActualizarMedico.nombre() != null) {
           this.nombre = datosActualizarMedico.nombre();
       }
       if(datosActualizarMedico.documento() != null) {
           this.documento = datosActualizarMedico.documento();
       }
       if(datosActualizarMedico.direccion() != null) {
           this.direccion = direccion.actualizarDatos(datosActualizarMedico.direccion());
       }
    }

    public void desactivarMedico() {
        this.activo = false;
    }
}
