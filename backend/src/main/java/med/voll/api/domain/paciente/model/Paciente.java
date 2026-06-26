package med.voll.api.domain.paciente.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.direccion.Direccion;
import med.voll.api.domain.paciente.dto.DatosRegistroPaciente;
import med.voll.api.domain.shared.BaseAuditable;
import med.voll.api.domain.usuarios.model.Usuario;
import med.voll.api.domain.familiar.model.GrupoFamiliar;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pacientes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Paciente extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = true)
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @Column(nullable = false)
    private String nombre;

    private String telefono;

    private String dni;             // para dependientes (titular tiene su dni en Usuario)

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(nullable = false)
    private Boolean activo = true;

    @Embedded
    private Direccion direccion;

    @Column(nullable = false)
    private LocalDate fechaAlta = LocalDate.now();

    @OneToOne(mappedBy = "pacienteDependiente", fetch = FetchType.LAZY)
    @JsonIgnore
    private GrupoFamiliar vinculoFamiliar;

    // ============================================
    // Relación con Consultas (solo lectura)
    // ============================================
    @OneToMany(mappedBy = "paciente", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Consulta> consultas = new ArrayList<>();

    // ============================================
    // Helpers
    // ============================================
    public String getNombre() { return this.nombre; }

    @Transient
    public String getEmail() {
        return usuario != null ? usuario.getEmail() : null;
    }

    @Transient
    public String getDni() {
        return usuario != null ? usuario.getDni() : this.dni;
    }

    @Transient
    public Long getUsuarioId() {
        return usuario != null ? usuario.getId() : null;
    }

    public boolean esDependiente() { return usuario == null; }

    // ============================================
    // Constructor desde DTO (para Titulares)
    // ============================================
    public Paciente(DatosRegistroPaciente dto, Usuario usuario) {
        this.usuario = usuario;
        this.nombre = dto.nombre();
        this.telefono = dto.telefono();
        this.dni = dto.dni();
        this.activo = true;
        this.direccion = dto.direccion() != null ? new Direccion(dto.direccion()) : null;
        this.fechaAlta = LocalDate.now();
    }

    // ============================================
    // Constructor para Dependientes (sin Usuario)
    // ============================================
    public Paciente(med.voll.api.domain.familiar.dto.DatosRegistrarDependienteDTO dto) {
        this.usuario = null;
        this.nombre = dto.nombre();
        this.telefono = dto.telefono();
        this.dni = dto.dni();
        this.fechaNacimiento = dto.fechaNacimiento();
        this.activo = true;
        this.direccion = dto.direccion() != null ? new Direccion(dto.direccion()) : null;
        this.fechaAlta = LocalDate.now();
    }

    // ============================================
    // Actualización
    // ============================================
    public void actualizar(DatosRegistroPaciente.DatosActualizarPaciente dto) {
        if (dto.nombre() != null) {
            this.nombre = dto.nombre();
        }
        if (dto.telefono() != null) {
            this.telefono = dto.telefono();
        }
        if (dto.direccion() != null) {
            if (this.direccion == null) {
                this.direccion = new Direccion(dto.direccion());
            } else {
                this.direccion = this.direccion.actualizarDatos(dto.direccion());
            }
        }
    }


// ============================
// Desactivación (soft delete)
// ============================
    public void desactivar(String usuario) {
        this.activo = false;
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = usuario;
    }

    // ============================
// Re-activación
// ============================
    public void activar() {
        this.activo = true;
        this.deletedAt = null;
        this.deletedBy = null;
    }

}
