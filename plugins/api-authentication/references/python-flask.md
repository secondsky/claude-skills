# Python Flask Authentication

## Flask JWT with Role-Based Access

```python
from flask import Flask, request, jsonify
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import os

app = Flask(__name__)

# IMPORTANT: In production, always set JWT_SECRET_KEY via environment variables.
# Never commit secrets to version control.
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-me')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(
    minutes=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', '15'))
)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(
    days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES_DAYS', '7'))
)

jwt = JWTManager(app)

# Role-based access decorator
def role_required(roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@app.route('/login', methods=['POST'])
def login():
    # Parse JSON safely
    try:
        data = request.get_json()
    except Exception:
        return jsonify({'error': 'Invalid JSON'}), 400

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    # Validate required fields
    email = data.get('email')
    password = data.get('password')

    if not email or not isinstance(email, str) or not email.strip():
        return jsonify({'error': 'Valid email required'}), 400

    if not password or not isinstance(password, str) or not password:
        return jsonify({'error': 'Valid password required'}), 400

    try:
        # Query database
        user = User.query.filter_by(email=email).first()

        # Check credentials - only call check_password_hash if user exists
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Create tokens
        access_token = create_access_token(
            identity=user.id,
            additional_claims={'role': user.role, 'email': user.email}
        )
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token
        })

    except Exception as e:
        # Log the error for debugging
        app.logger.error(f'Login error: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    user = User.query.get(identity)
    access_token = create_access_token(
        identity=identity,
        additional_claims={'role': user.role}
    )
    return jsonify({'access_token': access_token})

@app.route('/admin', methods=['GET'])
@role_required(['admin'])
def admin_only():
    return jsonify({'message': 'Admin access granted'})

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({'user_id': current_user})
```

## OAuth 2.0 with Google (Passport.js Style)

```python
from flask import Flask, redirect, url_for, session
from authlib.integrations.flask_client import OAuth
import os

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-change-me')
oauth = OAuth(app)

# IMPORTANT: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.
# Never commit credentials to version control.
# Register redirect URI (e.g., http://localhost:5000/callback/google) in Google Console.
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

if not os.getenv('GOOGLE_CLIENT_ID') or not os.getenv('GOOGLE_CLIENT_SECRET'):
    raise ValueError('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment')

@app.route('/login/google')
def google_login():
    redirect_uri = url_for('google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/callback/google')
def google_callback():
    token = google.authorize_access_token()
    user_info = token.get('userinfo')

    # Find or create user
    user = User.query.filter_by(google_id=user_info['sub']).first()
    if not user:
        user = User(
            email=user_info['email'],
            name=user_info['name'],
            google_id=user_info['sub']
        )
        db.session.add(user)
        db.session.commit()

    # Generate JWT for the user
    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token})
```

## API Key Authentication

```python
import hashlib
import secrets
import logging
from functools import wraps
from flask import request, jsonify
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_api_key():
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)

def hash_api_key(key):
    """Hash API key for storage"""
    return hashlib.sha256(key.encode()).hexdigest()

def api_key_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key required'}), 401

        try:
            key_hash = hash_api_key(api_key)
            api_key_record = ApiKey.query.filter_by(key_hash=key_hash, active=True).first()

            if not api_key_record:
                return jsonify({'error': 'Invalid API key'}), 401

            # Update last used timestamp
            api_key_record.last_used = datetime.utcnow()
            db.session.commit()

        except Exception as e:
            # Rollback on database error
            db.session.rollback()
            logger.error(f'API key validation error: {str(e)}')
            return jsonify({'error': 'Internal server error'}), 500

        return fn(*args, **kwargs)
    return wrapper

@app.route('/api/data')
@api_key_required
def get_data():
    return jsonify({'data': 'protected resource'})
```
