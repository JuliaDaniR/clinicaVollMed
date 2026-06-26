package med.voll.api.infra.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final SecurityFilter securityFilter;

    // Origenes permitidos vía variable de entorno (separados por coma)
    // Ej: http://localhost:5173,https://mi-frontend.onrender.com
    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String corsAllowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // 👉 Rutas públicas
                        .requestMatchers(HttpMethod.POST, "/usuario").permitAll()
                        .requestMatchers(HttpMethod.POST, "/pacientes").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/swagger-ui/**"
                        ).permitAll()
                        .requestMatchers("/actuator/**").permitAll()

                        // 👉 Recuperación de contraseña
                        .requestMatchers(HttpMethod.POST, "/auth/forgot-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/reset-password").permitAll()

                        // 👉 Refresh token
                        .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()

                        // 👉 Logout
                        .requestMatchers(HttpMethod.POST, "/auth/logout").permitAll()

                        // 👉 Rutas SOLO ADMIN
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/usuario/*/rol").hasRole("ADMIN")

                        // 👉 Rutas de gestión (médicos/pacientes/consultas)
                        .requestMatchers(HttpMethod.POST, "/medicos/**").hasAnyRole("ADMIN", "RECEPCIONISTA")
                        .requestMatchers(HttpMethod.PUT, "/medicos/**").hasAnyRole("ADMIN", "RECEPCIONISTA")
                        .requestMatchers(HttpMethod.DELETE, "/medicos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/medicos", "/medicos/**").hasAnyRole("ADMIN", "RECEPCIONISTA", "MEDICO", "PACIENTE")

                        .requestMatchers(HttpMethod.GET, "/pacientes", "/pacientes/**").hasAnyRole("ADMIN", "RECEPCIONISTA", "MEDICO", "PACIENTE")
                        .requestMatchers("/pacientes", "/pacientes/**").hasAnyRole("ADMIN", "RECEPCIONISTA", "PACIENTE")

                        .requestMatchers("/consultas/**").hasAnyRole("ADMIN", "RECEPCIONISTA", "MEDICO", "PACIENTE")

                        .requestMatchers("/horarios/**").hasAnyRole("ADMIN", "RECEPCIONISTA", "MEDICO")

                        .requestMatchers(HttpMethod.POST, "/usuario/cambio-email").authenticated()
                        .requestMatchers(HttpMethod.POST, "/usuario/confirmar-cambio-email").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Lee los orígenes desde la variable de entorno CORS_ALLOWED_ORIGINS (separados por coma)
        List<String> origins = Arrays.asList(corsAllowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
