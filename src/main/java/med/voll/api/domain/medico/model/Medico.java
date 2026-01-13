package med.voll.api.domain.medico.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.direccion.Direccion;
import med.voll.api.domain.horario.model.ConfiguracionHorariaMedico;
import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.medico.dto.DatosActualizarMedico;
import med.voll.api.domain.medico.dto.DatosRegistroMedico;
import med.voll.api.domain.medico.model.enumerator.Especialidad;
import med.voll.api.domain.shared.BaseAuditable;
import med.voll.api.domain.usuarios.model.Usuario;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Medico extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @Column(nullable = false)
    private String matricula;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Especialidad especialidad;

    @Embedded
    private Direccion direccion;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(nullable = false)
    private LocalDate fechaAlta = LocalDate.now();

    // Relación con configuraciones
    @OneToMany(mappedBy = "medico")
    private List<ConfiguracionHorariaMedico> configuraciones;

    @OneToMany(mappedBy = "medico")
    @JsonIgnore
    private List<TurnoDisponible> turnos;

    @OneToMany(mappedBy = "medico", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Consulta> consultas = new ArrayList<>();

    public Medico(DatosRegistroMedico dto, Usuario usuario) {
        this.usuario = usuario;
        this.matricula = dto.matricula();
        this.especialidad = dto.especialidad();
        this.direccion = new Direccion(dto.direccion());
        this.activo = true;
    }

    public void actualizar(DatosActualizarMedico dto) {
        if (dto.matricula() != null)
            this.matricula = dto.matricula();

        if (dto.especialidad() != null)
            this.especialidad = dto.especialidad();

        if (dto.direccion() != null)
            this.direccion = this.direccion.actualizarDatos(dto.direccion());
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
