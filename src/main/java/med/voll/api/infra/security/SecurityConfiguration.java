package med.voll.api.infra.security;

import lombok.RequiredArgsConstructor;
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

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

    private final SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // 👉 Rutas públicas
                        .requestMatchers(HttpMethod.POST, "/usuario").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/swagger-ui/**"
                        ).permitAll()

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
                        .requestMatchers(HttpMethod.GET, "/medicos/**").hasAnyRole("ADMIN", "RECEPCIONISTA", "MEDICO")

                        .requestMatchers("/pacientes/**").hasAnyRole("ADMIN", "RECEPCIONISTA")
                        .requestMatchers("/consultas/**").hasAnyRole("ADMIN", "RECEPCIONISTA", "MEDICO")

                        // 👉 Cualquier otra ruta requiere autenticación
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
}
