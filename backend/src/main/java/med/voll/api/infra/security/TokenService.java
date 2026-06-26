package med.voll.api.infra.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import med.voll.api.domain.usuarios.model.Usuario;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.ChronoUnit;

@Service
public class TokenService {

    @Value("${api.security.secret}")
    private String secret;

    public String generarAccessToken(Usuario usuario) {

        Algorithm algo = Algorithm.HMAC256(secret);

        return JWT.create()
                .withIssuer("vollmed-api")
                .withSubject(usuario.getEmail())
                .withClaim("id", usuario.getId())
                .withClaim("roles", usuario.getRoles().stream()
                        .map(r -> r.getNombre().name())
                        .toList())
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .sign(algo);
    }

    public String getSubject(String token) {
        Algorithm algo = Algorithm.HMAC256(secret);

        return JWT.require(algo)
                .withIssuer("vollmed-api")
                .build()
                .verify(token)
                .getSubject();
    }
}

