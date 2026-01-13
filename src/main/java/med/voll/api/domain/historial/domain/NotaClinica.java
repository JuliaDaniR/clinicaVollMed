package med.voll.api.domain.historial.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.medico.model.Medico;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "notas_clinicas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotaClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "historia_clinica_id", nullable = false)
    @JsonIgnore
    private HistoriaClinica historiaClinica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenido;

    private LocalDate fecha = LocalDate.now();
}
