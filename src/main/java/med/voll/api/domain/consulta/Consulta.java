package med.voll.api.domain.consulta;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.paciente.Paciente;

import java.time.LocalDateTime;

@Entity(name = "Consulta")
@Table(name = "consultas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id")
    private Medico medico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    private LocalDateTime fecha;
    
    private Boolean cancelada = false;

    @Column(name = "motivo_cancelamiento")
    @Enumerated(EnumType.STRING)
    private MotivoCancelamiento motivoCancelamiento;

    public Consulta(Medico medico,Paciente paciente, LocalDateTime fecha){
        this.medico = medico;
        this.paciente = paciente;
        this.fecha = fecha;
    }

    public void cancelar(MotivoCancelamiento motivo){
        this.cancelada = true;
        this.motivoCancelamiento = motivo;
    }
    
     public void actualizarInformacion(DatosAgendarConsulta.DatosActualizarConsulta datos, Medico medico , Paciente paciente) {
  
        if (datos.idMedico() != null) {
            this.medico = medico;
        }
        if (datos.idPaciente() != null) {
            this.paciente = paciente;
        }
        if (datos.motivoCancelamiento() != null){
            this.motivoCancelamiento = datos.motivoCancelamiento();
        }
    }
}
