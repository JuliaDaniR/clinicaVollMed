package med.voll.api.domain.consulta.repository;

import med.voll.api.domain.consulta.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface IConsultaRepository extends JpaRepository<Consulta, Long> {
   Boolean existsByPacienteIdAndFechaBetween(Long idPaciente, LocalDateTime primerHorario, LocalDateTime ultimoHorario);

   Boolean existsByMedicoIdAndFecha(Long idMedico, LocalDateTime fecha);
}
