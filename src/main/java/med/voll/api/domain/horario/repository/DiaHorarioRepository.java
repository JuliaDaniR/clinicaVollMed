package med.voll.api.domain.horario.repository;

import med.voll.api.domain.horario.model.DiaHorarioMedico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiaHorarioRepository extends JpaRepository<DiaHorarioMedico, Long> {
}
