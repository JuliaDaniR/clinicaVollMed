package med.voll.api.repository;

import med.voll.api.domain.medico.Especialidad;
import med.voll.api.domain.medico.Medico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface IMedicoRepository extends JpaRepository<Medico, Long> {
    Page <Medico> findByActivoTrue(Pageable paginacion);

    @Query("""
            select m from Medico m
            Where m.activo=1 and
            m.especialidad: especialidad and
            m.id not int(
            select c.medico.id from Consulta c
            c.data: fecha
            )
            by order by rand()
            limit 1
            """)
    Medico seleccionarMedicoPorEspecialidadEnFecha(Especialidad especialidad, LocalDateTime fecha);
}
