package med.voll.api.infra.security.refresh;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "RefreshRequest", description = "Solicitud para renovar tokens JWT")
public record RefreshRequest(

        @Schema(
                description = "Refresh token válido",
                example = "7d7bfd0e-71e7-4d49-b85e-24051ba83b29"
        )
        String refreshToken
) {}