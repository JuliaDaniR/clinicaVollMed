package med.voll.api.domain.horario.model;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.medico.model.Medico;

import java.util.List;

@Entity
@Table(name = "configuracion_horaria_medico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionHorariaMedico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id")
    private Medico medico;

    @OneToMany(mappedBy = "configuracion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiaHorarioMedico> dias;  // lunes, martes, etc.

    private Boolean activa = true;

    /** Duración del turno.
     * Si es null → se usa la duración de la especialidad.
     */
    private Integer duracionMinutosPersonalizada;

    public int getDuracionTurno() {
        return duracionMinutosPersonalizada != null
                ? duracionMinutosPersonalizada
                : medico.getEspecialidad().getDuracionMinutos();
    }
}
