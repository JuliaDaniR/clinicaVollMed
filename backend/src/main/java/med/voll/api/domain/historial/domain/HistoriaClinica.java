package med.voll.api.domain.historial.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.paciente.model.Paciente;
import med.voll.api.domain.shared.BaseAuditable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "historias_clinicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"paciente"}) // evita ciclo paciente → historia → paciente
public class HistoriaClinica extends BaseAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "paciente_id", unique = true)
    private Paciente paciente;

    @OneToMany(
            mappedBy = "historiaClinica",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonIgnore
    private List<NotaClinica> notas = new ArrayList<>();

    @Column(nullable = false)
    private LocalDate fechaCreacion = LocalDate.now();

    public void agregarNota(NotaClinica nota) {
        nota.setHistoriaClinica(this);
        notas.add(nota);
    }
}
