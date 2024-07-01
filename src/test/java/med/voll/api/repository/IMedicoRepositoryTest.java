package med.voll.api.repository;

import med.voll.api.domain.consulta.Consulta;
import med.voll.api.domain.direccion.DatosDireccion;
import med.voll.api.domain.medico.DatosRegistroMedico;
import med.voll.api.domain.medico.Especialidad;
import med.voll.api.domain.medico.Medico;
import med.voll.api.domain.paciente.DatosRegistroPaciente;
import med.voll.api.domain.paciente.Paciente;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjuster;
import java.time.temporal.TemporalAdjusters;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class IMedicoRepositoryTest {
    @Autowired
    private IMedicoRepository medicoRepository;
    @Autowired
    private TestEntityManager em;
//
//    @Test
//    @DisplayName("deberia retornar nulo cuando el medico se encuentre en consulta con otro paciente en ese horario")
//    void seleccionarMedicoPorEspecialidadEnFecha() {
//
//        //given(dado)
//        var proximoLunes10Am = LocalDate.now()
//                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
//                .atTime(10, 0);
//
//        var medico = registrarMedico("Franco","fran@email.com", "223787",Especialidad.CARDIOLOGIA);
//        Paciente paciente;
//        paciente = registrarPaciente("Mercedes","merce@email.com", "322344");
//        registrarConsulta(medico, paciente, proximoLunes10Am);
//
//        //when(cuando)
//        var medicoLibre = medicoRepository.seleccionarMedicoPorEspecialidadEnFecha(Especialidad.CARDIOLOGIA, proximoLunes10Am);
//
//        //then(entonces)
//        assertThat(medicoLibre).isNull();
//    }

//    @Test
//    @DisplayName("deberia retornar un medico cuando realice la consulta en la base de datos para ese horario")
//    void seleccionarMedicoPorEspecialidadEnFechaEscenario2() {
//
//        var proximoLunes10Am = LocalDate.now()
//                .with(TemporalAdjusters.next(DayOfWeek.FRIDAY))
//                .atTime(10, 0);
//
//        var medico = registrarMedico("Felipe","fredi@email.com", "223487",Especialidad.CARDIOLOGIA);
//
//        var medicoLibre = medicoRepository.seleccionarMedicoPorEspecialidadEnFecha(Especialidad.CARDIOLOGIA, proximoLunes10Am);
//
//        assertThat(medicoLibre).isEqualTo(medico);
//    }
    private void registrarConsulta(Medico medico, Paciente paciente, LocalDateTime fecha) {
        em.persist(new Consulta(medico, paciente, fecha));
    }

    private Medico registrarMedico(String nombre, String email, String documento, Especialidad especialidad) {
        var medico = new Medico(datosMedico(nombre, email, documento, especialidad));
        em.persist(medico);
        return medico;
    }

    private DatosRegistroMedico datosMedico(String nombre, String email, String documento, Especialidad especialidad) {
        return new DatosRegistroMedico(
                nombre,
                email,
                "23332222",
                documento,
                especialidad,
                datosDireccion()
        );
    }

    private Paciente registrarPaciente(String nombre, String email, String documentoIdentidad) {
        var paciente = new Paciente(datosPaciente(nombre, email, documentoIdentidad));
        em.persist(paciente);
        return paciente;
    }

    private DatosRegistroPaciente datosPaciente(String nombre, String email, String documentoIdentidad) {
        return new DatosRegistroPaciente(
                nombre,
                email,
                "345675434",
                documentoIdentidad,
                datosDireccion()
        );
    }

    private DatosDireccion datosDireccion() {
        return new DatosDireccion(
                "local",
                "azul",
                "acapulco",
                "321",
                "12"
        );
    }
}