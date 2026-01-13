package med.voll.api.controller;

import med.voll.api.domain.consulta.service.AgendaDeConsultaService;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.consulta.dto.DatosDetalleConsulta;
import med.voll.api.domain.medico.model.enumerator.Especialidad;
import med.voll.api.infra.errores.ApiResponseDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureJsonTesters
class ConsultaControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JacksonTester<DatosAgendarConsulta> agendarConsultaJson;

    @Autowired
    private JacksonTester<ApiResponseDTO> apiResponseJson;

    @MockBean
    private AgendaDeConsultaService consultaService;

    // ==========================================================
    // 1. Escenario: datos inválidos → 400
    // ==========================================================
    @Test
    @DisplayName("Debe retornar HTTP 400 cuando los datos de la consulta sean inválidos")
    @WithMockUser
    void agendarEscenario1() throws Exception {

        // GIVEN (request vacío => inválido)
        var response = mvc.perform(
                post("/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
        ).andReturn().getResponse();

        // THEN
        assertThat(response.getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST.value());
    }

    // ==========================================================
    // 2. Escenario: datos válidos → 201 con ApiResponseDTO
    // ==========================================================
    @Test
    @DisplayName("Debe retornar HTTP 201 cuando los datos son válidos")
    @WithMockUser
    void agendarEscenario2() throws Exception {

        // GIVEN
        var fecha = LocalDateTime.now().plusHours(5);

        var requestDTO = new DatosAgendarConsulta(
                2L,           // idPaciente
                1L,           // idMedico
                Especialidad.CARDIOLOGIA,
                fecha
        );

        var detalleConsulta = new DatosDetalleConsulta(
                100L,
                1L,
                2L,
                fecha,
                false,
                null
        );

        var respuestaService = new ApiResponseDTO(
                true,
                "Consulta agendada correctamente",
                detalleConsulta,
                HttpStatus.CREATED
        );

        when(consultaService.agendarConsulta(any()))
                .thenReturn(respuestaService);

        // WHEN
        var response = mvc.perform(
                post("/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(agendarConsultaJson.write(requestDTO).getJson())
        ).andReturn().getResponse();

        // THEN
        assertThat(response.getStatus())
                .isEqualTo(HttpStatus.CREATED.value());

        assertThat(response.getContentAsString())
                .isEqualTo(apiResponseJson.write(respuestaService).getJson());
    }
}
