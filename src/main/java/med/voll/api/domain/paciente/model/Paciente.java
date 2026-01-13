package med.voll.api.domain.paciente.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.direccion.Direccion;
import med.voll.api.domain.paciente.dto.DatosRegistroPaciente;
import med.voll.api.domain.shared.BaseAuditable;
import med.voll.api.domain.usuarios.model.Usuario;

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

    @OneToOne(optional = false)
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @Column(nullable = false)
    private Boolean activo = true;

    @Embedded
    private Direccion direccion;

    @Column(nullable = false)
    private LocalDate fechaAlta = LocalDate.now();

    // ============================================
    // Relación con Consultas (solo lectura)
    // ============================================
    @OneToMany(mappedBy = "paciente", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Consulta> consultas = new ArrayList<>();

    // ============================================
    // Constructor desde DTO
    // ============================================
    public Paciente(DatosRegistroPaciente dto, Usuario usuario) {
        this.usuario = usuario;
        this.activo = true;
        this.direccion = new Direccion(dto.direccion());
        this.fechaAlta = LocalDate.now();
    }

    // ============================================
    // Actualización
    // ============================================
    public void actualizar(DatosRegistroPaciente.DatosActualizarPaciente dto) {
        if (dto.direccion() != null) {
            this.direccion = this.direccion.actualizarDatos(dto.direccion());
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
