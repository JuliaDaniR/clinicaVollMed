package med.voll.api.repository;

import med.voll.api.domain.consulta.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface IConsultaRepository extends JpaRepository<Consulta, Long> {
   Boolean existsByPacienteIdAndFechaBetween(Long idPaciente, LocalDateTime primerHorario, LocalDateTime ultimoHorario);

   Boolean existsByMedicoIdAndFecha(Long idMedico, LocalDateTime fecha);
}
