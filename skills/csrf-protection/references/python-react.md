# Python Flask and React CSRF Implementation

## Flask-WTF CSRF Protection

```python
from flask import Flask, render_template, request, jsonify
from flask_wtf.csrf import CSRFProtect, generate_csrf

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # 1 hour
app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True

csrf = CSRFProtect(app)

# Endpoint to get CSRF token for SPAs
@app.route('/api/csrf-token', methods=['GET'])
def get_csrf_token():
    token = generate_csrf()
    response = jsonify({'csrf_token': token})
    response.set_cookie(
        'XSRF-TOKEN',
        token,
        samesite='Strict',
        secure=True
    )
    return response

# Exempt specific routes if needed
@app.route('/api/webhook', methods=['POST'])
@csrf.exempt
def webhook():
    # Validate using signature instead
    return jsonify({'status': 'ok'})

# Protected route
@app.route('/api/transfer', methods=['POST'])
def transfer():
    # CSRF is automatically validated
    data = request.get_json()
    return jsonify({'success': True})
```

## Flask with Form Template

```python
from flask_wtf import FlaskForm
from wtforms import StringField, DecimalField
from wtforms.validators import DataRequired

class TransferForm(FlaskForm):
    recipient = StringField('Recipient', validators=[DataRequired()])
    amount = DecimalField('Amount', validators=[DataRequired()])

@app.route('/transfer', methods=['GET', 'POST'])
def transfer_page():
    form = TransferForm()
    if form.validate_on_submit():
        # Process transfer
        return redirect(url_for('success'))
    return render_template('transfer.html', form=form)
```

```html
<!-- transfer.html -->
<form method="POST">
    {{ form.hidden_tag() }}  <!-- Includes CSRF token -->
    {{ form.recipient.label }} {{ form.recipient() }}
    {{ form.amount.label }} {{ form.amount() }}
    <button type="submit">Transfer</button>
</form>
```

## React Frontend Integration

```javascript
// hooks/useCsrf.js
import { useState, useEffect } from 'react';

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf-token', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrf_token));
  }, []);

  return csrfToken;
}

// api/client.js
export async function securePost(url, data) {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(data),
  });
}

// components/TransferForm.jsx
import { useCsrf } from '../hooks/useCsrf';
import { securePost } from '../api/client';

export function TransferForm() {
  const csrfToken = useCsrf();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const response = await securePost('/api/transfer', {
      recipient: formData.get('recipient'),
      amount: formData.get('amount'),
    });

    if (response.ok) {
      // Handle success
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="_csrf" value={csrfToken} />
      <input name="recipient" required />
      <input name="amount" type="number" required />
      <button type="submit">Transfer</button>
    </form>
  );
}
```

## Double Submit Cookie Pattern

```python
import hmac
import hashlib
from functools import wraps

def validate_double_submit(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        cookie_token = request.cookies.get('XSRF-TOKEN')
        header_token = request.headers.get('X-XSRF-TOKEN')

        if not cookie_token or not header_token:
            return jsonify({'error': 'CSRF token missing'}), 403

        # Timing-safe comparison
        if not hmac.compare_digest(cookie_token, header_token):
            return jsonify({'error': 'CSRF token mismatch'}), 403

        return fn(*args, **kwargs)
    return wrapper
```
