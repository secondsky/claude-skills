# Python and Java OAuth Implementations

## Python OpenID Connect with Flask/Authlib

```python
from flask import Flask, redirect, url_for, session
from authlib.integrations.flask_client import OAuth
from authlib.integrations.flask_oauth2 import AuthorizationServer
from authlib.oauth2.rfc6749 import grants
from authlib.jose import jwt
import time

app = Flask(__name__)
app.secret_key = 'your-secret-key'
oauth = OAuth(app)

# Configure OAuth Provider
oauth.register(
    name='google',
    client_id='your-client-id',
    client_secret='your-client-secret',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.route('/login')
def login():
    redirect_uri = url_for('authorize', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route('/authorize')
def authorize():
    token = oauth.google.authorize_access_token()
    user_info = token.get('userinfo')
    if user_info:
        session['user'] = user_info
    return redirect('/')
```

## Building an OIDC Provider

```python
from authlib.integrations.flask_oauth2 import AuthorizationServer
from authlib.oauth2.rfc6749.grants import AuthorizationCodeGrant
from authlib.oidc.core import UserInfo
from authlib.oidc.core.grants import OpenIDCode

class MyAuthorizationCodeGrant(OpenIDCode, AuthorizationCodeGrant):
    def get_jwt_config(self):
        return {
            'key': current_app.config['JWT_PRIVATE_KEY'],
            'alg': 'RS256',
            'iss': 'https://auth.example.com',
            'exp': 3600,
        }

    def generate_user_info(self, user, scope):
        return UserInfo(
            sub=str(user.id),
            email=user.email,
            name=user.name,
            email_verified=user.email_verified
        )

authorization = AuthorizationServer()
authorization.register_grant(MyAuthorizationCodeGrant)

# Discovery Endpoint
@app.route('/.well-known/openid-configuration')
def openid_configuration():
    return {
        'issuer': 'https://auth.example.com',
        'authorization_endpoint': 'https://auth.example.com/authorize',
        'token_endpoint': 'https://auth.example.com/token',
        'userinfo_endpoint': 'https://auth.example.com/userinfo',
        'jwks_uri': 'https://auth.example.com/.well-known/jwks.json',
        'response_types_supported': ['code', 'token', 'id_token'],
        'subject_types_supported': ['public'],
        'id_token_signing_alg_values_supported': ['RS256']
    }

# JWKS Endpoint
@app.route('/.well-known/jwks.json')
def jwks():
    return {
        'keys': [
            {
                'kty': 'RSA',
                'use': 'sig',
                'alg': 'RS256',
                'kid': 'key-id-1',
                'n': '<base64url-encoded-modulus>',
                'e': 'AQAB'
            }
        ]
    }
```

## Java Spring Security OAuth2

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

@Configuration
@EnableWebSecurity
public class AuthServerConfig {

    @Bean
    public RegisteredClientRepository registeredClientRepository() {
        RegisteredClient webClient = RegisteredClient.withId(UUID.randomUUID().toString())
            .clientId("web-client")
            .clientSecret("{noop}secret")
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
            .redirectUri("https://app.example.com/callback")
            .scope("openid")
            .scope("profile")
            .scope("email")
            .tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofMinutes(15))
                .refreshTokenTimeToLive(Duration.ofDays(7))
                .reuseRefreshTokens(false)
                .build())
            .build();

        return new InMemoryRegisteredClientRepository(webClient);
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource() {
        RSAKey rsaKey = generateRsa();
        JWKSet jwkSet = new JWKSet(rsaKey);
        return (jwkSelector, securityContext) -> jwkSelector.select(jwkSet);
    }

    private static RSAKey generateRsa() {
        KeyPair keyPair = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        return new RSAKey.Builder(publicKey)
            .privateKey(privateKey)
            .keyID(UUID.randomUUID().toString())
            .build();
    }
}
```

## Token Introspection Endpoint

```python
@app.route('/oauth/introspect', methods=['POST'])
def introspect_token():
    token = request.form.get('token')
    token_type = request.form.get('token_type_hint', 'access_token')

    try:
        payload = jwt.decode(token, current_app.config['JWT_PUBLIC_KEY'])
        return {
            'active': True,
            'scope': payload.get('scope'),
            'client_id': payload.get('client_id'),
            'username': payload.get('sub'),
            'exp': payload.get('exp'),
            'iat': payload.get('iat'),
            'iss': payload.get('iss')
        }
    except Exception:
        return {'active': False}
```

## Token Revocation

```python
revoked_tokens = set()  # Use Redis in production

@app.route('/oauth/revoke', methods=['POST'])
def revoke_token():
    token = request.form.get('token')
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    revoked_tokens.add(token_hash)
    return '', 200

def is_token_revoked(token):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token_hash in revoked_tokens
```
