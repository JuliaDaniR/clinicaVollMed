package med.voll.api.domain.horario.repository;

import med.voll.api.domain.horario.model.TurnoDisponible;
import med.voll.api.domain.horario.model.enumerator.EstadoTurno;
import med.voll.api.domain.medico.model.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
@Repository
public interface TurnoDisponibleRepository extends JpaRepository<TurnoDisponible, Long> {

    boolean existsByMedicoAndFechaAndHora(Medico medico, LocalDate fecha, LocalTime hora);

    void deleteByMedicoAndFechaAfter(Medico medico, LocalDate fecha);

    List<TurnoDisponible> findByMedicoIdAndEstadoOrderByFechaAscHoraAsc(Long medicoId, EstadoTurno estadoTurno);

    List<TurnoDisponible> findByMedicoIdAndFechaBetween(Long medicoId, LocalDate from, LocalDate to);

    @Modifying
    @Query("""
    DELETE FROM TurnoDisponible t
    WHERE t.medico.id = :medicoId
    AND t.fecha > CURRENT_DATE
    AND t.estado = 'DISPONIBLE'
""")
    void deleteFutureDisponiblesByMedico(@Param("medicoId") Long medicoId);
}
