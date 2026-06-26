package med.voll.api.domain.consulta.repository;

import med.voll.api.domain.consulta.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IConsultaRepository extends JpaRepository<Consulta, Long> {
   Boolean existsByPacienteIdAndFechaBetween(Long idPaciente, LocalDateTime primerHorario, LocalDateTime ultimoHorario);

   Boolean existsByMedicoIdAndFecha(Long idMedico, LocalDateTime fecha);

   List<Consulta> findAllByOrderByFechaAsc();

   List<Consulta> findByMedicoUsuarioEmailOrderByFechaAsc(String email);

   List<Consulta> findByPacienteUsuarioEmailOrderByFechaAsc(String email);

   @Query("""
       SELECT c FROM Consulta c
       LEFT JOIN c.paciente p
       LEFT JOIN p.usuario u
       WHERE u.email = :email
          OR p.id IN (
              SELECT gf.pacienteDependiente.id FROM GrupoFamiliar gf
              LEFT JOIN gf.pacienteTitular pt
              LEFT JOIN pt.usuario tu
              WHERE tu.email = :email
                AND gf.activo = true
          )
       ORDER BY c.fecha ASC
   """)
   List<Consulta> findAllByTitularEmailIncluyendoFamilia(@Param("email") String email);
}
