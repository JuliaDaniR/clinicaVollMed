package med.voll.api.domain.recetas.domain;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.consulta.model.Consulta;
import med.voll.api.domain.medico.model.Medico;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.recetas.dto.DatosCrearReceta;
import med.voll.api.domain.recetas.dto.DatosDetalleReceta;

import java.time.LocalDate;

@Entity
@Table(name = "recetas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecetaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // PACIENTE
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    // MÉDICO
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id")
    private Medico medico;

    // CONSULTA (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consulta_id")
    private Consulta consulta;

    @Column(nullable = false)
    private LocalDate fecha = LocalDate.now();

    @Column(nullable = false, columnDefinition = "TEXT")
    private String indicaciones;

    public RecetaMedica(DatosCrearReceta dto, Medico medico, Paciente paciente, Consulta consulta) {
        this.medico = medico;
        this.paciente = paciente;
        this.consulta = consulta;
        this.indicaciones = dto.indicaciones();
        this.fecha = LocalDate.now();
    }

    public DatosDetalleReceta toDTO() {
        return new DatosDetalleReceta(
                id,
                medico.getId(),
                paciente.getId(),
                consulta != null ? consulta.getId() : null,
                fecha,
                indicaciones
        );
    }
}
