# React-Intl (Format.js) Implementation

Complete React internationalization with Format.js.

```tsx
import { IntlProvider, FormattedMessage, FormattedNumber, FormattedDate, useIntl } from 'react-intl';

// Message definitions
const messages = {
  en: {
    greeting: 'Hello, {name}!',
    items: '{count, plural, =0 {No items} one {# item} other {# items}}',
    price: 'Price: {amount}',
    lastUpdated: 'Last updated: {date}',
  },
  es: {
    greeting: '¡Hola, {name}!',
    items: '{count, plural, =0 {Sin artículos} one {# artículo} other {# artículos}}',
    price: 'Precio: {amount}',
    lastUpdated: 'Última actualización: {date}',
  },
};

// Provider setup
function App() {
  const [locale, setLocale] = useState('en');

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <LocaleSwitcher onChange={setLocale} />
      <Content />
    </IntlProvider>
  );
}

// Using FormattedMessage
function Content() {
  const intl = useIntl();
  const itemCount = 5;

  return (
    <div>
      <h1>
        <FormattedMessage id="greeting" values={{ name: 'John' }} />
      </h1>

      {/* Pluralization */}
      <p>
        <FormattedMessage id="items" values={{ count: itemCount }} />
      </p>

      {/* Currency formatting */}
      <p>
        <FormattedMessage
          id="price"
          values={{
            amount: (
              <FormattedNumber
                value={99.99}
                style="currency"
                currency="USD"
              />
            ),
          }}
        />
      </p>

      {/* Date formatting */}
      <p>
        <FormattedMessage
          id="lastUpdated"
          values={{
            date: (
              <FormattedDate
                value={new Date()}
                year="numeric"
                month="long"
                day="numeric"
              />
            ),
          }}
        />
      </p>

      {/* Imperative API */}
      <p>{intl.formatMessage({ id: 'greeting' }, { name: 'Jane' })}</p>
    </div>
  );
}

// Relative time
import { FormattedRelativeTime } from 'react-intl';

function TimeAgo({ date }) {
  const diff = (date - Date.now()) / 1000;

  return (
    <FormattedRelativeTime
      value={diff}
      numeric="auto"
      updateIntervalInSeconds={60}
    />
  );
}
```

## Python gettext Implementation

```python
import gettext
from babel.support import Translations
from flask import Flask, request, g
from functools import wraps

app = Flask(__name__)

# Supported languages
LANGUAGES = ['en', 'es', 'fr', 'de']
DEFAULT_LANGUAGE = 'en'


def get_locale():
    """Determine the best language for the user."""
    # Check URL parameter
    if 'lang' in request.args:
        lang = request.args.get('lang')
        if lang in LANGUAGES:
            return lang

    # Check cookie
    lang = request.cookies.get('language')
    if lang in LANGUAGES:
        return lang

    # Check Accept-Language header
    return request.accept_languages.best_match(LANGUAGES, DEFAULT_LANGUAGE)


@app.before_request
def load_translations():
    """Load translations for the current locale."""
    locale = get_locale()
    g.locale = locale

    translations_dir = 'translations'
    g.translations = Translations.load(translations_dir, [locale])


def _(message):
    """Shorthand for gettext."""
    return g.translations.ugettext(message)


def ngettext(singular, plural, n):
    """Handle pluralization."""
    return g.translations.ungettext(singular, plural, n)


# Usage in templates
@app.route('/')
def index():
    count = 5
    return render_template('index.html',
        greeting=_('Hello!'),
        items=ngettext('%(num)d item', '%(num)d items', count) % {'num': count}
    )


# Extract messages with Babel
# pybabel extract -F babel.cfg -o messages.pot .
# pybabel init -i messages.pot -d translations -l es
# pybabel compile -d translations
```

## RTL Language Support

```css
/* Use CSS logical properties */
.container {
  /* Instead of margin-left/margin-right */
  margin-inline-start: 1rem;
  margin-inline-end: 2rem;

  /* Instead of padding-left/padding-right */
  padding-inline-start: 1rem;
  padding-inline-end: 1rem;

  /* Instead of text-align: left/right */
  text-align: start;
}

/* Directional styles */
[dir="rtl"] .arrow-icon {
  transform: scaleX(-1);
}

[dir="rtl"] .sidebar {
  order: 1; /* Move to right side in RTL */
}
```

```typescript
// RTL detection and setup
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

function getDirection(locale: string): 'ltr' | 'rtl' {
  return RTL_LANGUAGES.includes(locale) ? 'rtl' : 'ltr';
}

function LocaleProvider({ children }) {
  const { locale } = useLocale();
  const direction = getDirection(locale);

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', locale);
  }, [locale, direction]);

  return children;
}
```

## ICU Message Format

```typescript
// Complex messages with ICU format
const messages = {
  taskStatus: `{count, plural,
    =0 {No tasks}
    one {# task}
    other {# tasks}
  } {count, plural,
    =0 {}
    other {remaining}
  }`,

  notification: `{type, select,
    message {You have a new message from {sender}}
    friend {You have a new friend request from {sender}}
    like {{sender} liked your post}
    other {You have a notification}
  }`,

  gender: `{gender, select,
    male {He}
    female {She}
    other {They}
  } liked your photo`,
};

// Usage
intl.formatMessage({ id: 'taskStatus' }, { count: 5 });
// "5 tasks remaining"

intl.formatMessage({ id: 'notification' }, { type: 'message', sender: 'John' });
// "You have a new message from John"
```
