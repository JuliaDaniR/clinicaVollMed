package med.voll.api.controller;

import med.voll.api.domain.consulta.service.AgendaDeConsultaService;
import med.voll.api.domain.consulta.dto.DatosAgendarConsulta;
import med.voll.api.domain.consulta.dto.DatosDetalleConsulta;
import med.voll.api.infra.errores.ApiResponseDTO;
import med.voll.api.infra.security.SecurityFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.token.TokenService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(controllers = ConsultaController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = SecurityFilter.class
        )
)
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

    @MockBean
    private TokenService tokenService;

    @Test
    @WithMockUser
    void agendarEscenario1() throws Exception {

        var response = mvc.perform(
                post("/consultas")
                        .with(csrf()) // ← CLAVE
                        .contentType(MediaType.APPLICATION_JSON)
        ).andReturn().getResponse();

        assertThat(response.getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST.value());
    }

    @Test
    @WithMockUser
    void agendarEscenario2() throws Exception {

        var requestDTO = new DatosAgendarConsulta(10L, 5L, "Dolor abdominal");
        var fecha = LocalDateTime.now().plusHours(5);

        var detalleConsulta = new DatosDetalleConsulta(
                100L, 1L, 5L, fecha, false, null
        );

        var respuestaService = new ApiResponseDTO(
                true,
                "Consulta agendada correctamente",
                detalleConsulta,
                HttpStatus.CREATED
        );

        when(consultaService.agendarConsulta(any()))
                .thenReturn(respuestaService);

        var response = mvc.perform(
                post("/consultas")
                        .with(csrf()) // ← CLAVE
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(agendarConsultaJson.write(requestDTO).getJson())
        ).andReturn().getResponse();

        assertThat(response.getStatus())
                .isEqualTo(HttpStatus.CREATED.value());

        assertThat(response.getContentAsString())
                .isEqualTo(apiResponseJson.write(respuestaService).getJson());
    }
}
