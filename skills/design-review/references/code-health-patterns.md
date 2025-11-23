# Code Health Patterns & Examples

**Purpose**: Detailed code examples and patterns for evaluating code health during design reviews
**Related**: SKILL.md Phase 6 - Code Health

---

## Component Reuse Patterns

### The DRY Principle in Components

**Bad**: Copy-pasted components with minor variations

```typescript
// ❌ File: UserCard.tsx
export function UserCard({ name, email }) {
  return (
    <div className="border rounded p-4 shadow">
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-sm text-gray-600">{email}</p>
    </div>
  );
}

// ❌ File: ProductCard.tsx
export function ProductCard({ title, price }) {
  return (
    <div className="border rounded p-4 shadow">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-gray-600">${price}</p>
    </div>
  );
}
```

**Good**: Extracted shared Card component

```typescript
// ✅ File: Card.tsx
export function Card({ title, subtitle, children }) {
  return (
    <div className="border rounded p-4 shadow">
      {title && <h3 className="text-lg font-bold">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      {children}
    </div>
  );
}

// ✅ File: UserCard.tsx
export function UserCard({ name, email }) {
  return <Card title={name} subtitle={email} />;
}

// ✅ File: ProductCard.tsx
export function ProductCard({ title, price }) {
  return <Card title={title} subtitle={`$${price}`} />;
}
```

---

## Design Token Usage

### Color Tokens

**Bad**: Hardcoded color values

```css
/* ❌ Hardcoded hex values scattered throughout */
.button-primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.button-secondary {
  background-color: #6b7280;
  color: #ffffff;
}

.error-text {
  color: #ef4444;
}

.success-text {
  color: #10b981;
}
```

**Good**: CSS variables / design tokens

```css
/* ✅ Define tokens once */
:root {
  --color-primary-600: #3b82f6;
  --color-gray-600: #6b7280;
  --color-error-600: #ef4444;
  --color-success-600: #10b981;
  --color-white: #ffffff;
}

/* ✅ Use tokens everywhere */
.button-primary {
  background-color: var(--color-primary-600);
  color: var(--color-white);
}

.button-secondary {
  background-color: var(--color-gray-600);
  color: var(--color-white);
}

.error-text {
  color: var(--color-error-600);
}

.success-text {
  color: var(--color-success-600);
}
```

**Tailwind CSS approach** (also good):

```html
<!-- ✅ Tailwind uses design tokens under the hood -->
<button class="bg-primary-600 text-white">Primary</button>
<button class="bg-gray-600 text-white">Secondary</button>
<p class="text-error-600">Error message</p>
<p class="text-success-600">Success message</p>
```

---

### Spacing Tokens

**Bad**: Magic number spacing

```css
/* ❌ Random pixel values with no system */
.card {
  padding: 17px;
  margin-bottom: 23px;
}

.section {
  margin-top: 35px;
  padding: 14px 19px;
}

.list-item {
  margin-bottom: 11px;
}
```

**Good**: 8-point grid system

```css
/* ✅ Define spacing scale (8px base) */
:root {
  --space-1: 4px;   /* 0.5 × base */
  --space-2: 8px;   /* 1 × base */
  --space-3: 12px;  /* 1.5 × base */
  --space-4: 16px;  /* 2 × base */
  --space-6: 24px;  /* 3 × base */
  --space-8: 32px;  /* 4 × base */
}

/* ✅ Use spacing tokens */
.card {
  padding: var(--space-4);        /* 16px */
  margin-bottom: var(--space-6);  /* 24px */
}

.section {
  margin-top: var(--space-8);     /* 32px */
  padding: var(--space-4);        /* 16px */
}

.list-item {
  margin-bottom: var(--space-3);  /* 12px */
}
```

**Tailwind CSS approach**:

```html
<!-- ✅ Tailwind's spacing scale (4px base) -->
<div class="p-4 mb-6">Card</div>          <!-- 16px padding, 24px margin-bottom -->
<div class="mt-8 p-4">Section</div>       <!-- 32px margin-top, 16px padding -->
<li class="mb-3">List item</li>           <!-- 12px margin-bottom -->
```

---

### Typography Tokens

**Bad**: Inconsistent font sizing

```css
/* ❌ Random font sizes */
h1 { font-size: 31px; font-weight: 700; }
h2 { font-size: 23px; font-weight: 650; }
h3 { font-size: 19px; font-weight: 600; }
body { font-size: 15px; }
.caption { font-size: 13px; }
```

**Good**: Type scale system

```css
/* ✅ Define type scale */
:root {
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}

/* ✅ Use type scale */
h1 { font-size: var(--text-4xl); font-weight: var(--font-bold); }
h2 { font-size: var(--text-2xl); font-weight: var(--font-semibold); }
h3 { font-size: var(--text-xl); font-weight: var(--font-semibold); }
body { font-size: var(--text-base); font-weight: var(--font-normal); }
.caption { font-size: var(--text-sm); }
```

---

### Border Radius Tokens

**Bad**: Inconsistent rounding

```css
/* ❌ Random border-radius values */
.button { border-radius: 7px; }
.card { border-radius: 9px; }
.input { border-radius: 5px; }
.modal { border-radius: 11px; }
```

**Good**: Consistent radius scale

```css
/* ✅ Define radius scale */
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* ✅ Use radius tokens */
.button { border-radius: var(--radius-md); }    /* 8px */
.card { border-radius: var(--radius-lg); }      /* 12px */
.input { border-radius: var(--radius-md); }     /* 8px */
.modal { border-radius: var(--radius-lg); }     /* 12px */
```

---

## Pattern Consistency

### Naming Conventions

**Bad**: Inconsistent naming

```typescript
// ❌ Mixed naming styles
const UserData = { ... };
const product_info = { ... };
const OrderDetails = { ... };

function FetchUser() { ... }
function get_products() { ... }
function loadOrderData() { ... }
```

**Good**: Consistent conventions

```typescript
// ✅ Consistent camelCase for variables/functions
const userData = { ... };
const productInfo = { ... };
const orderDetails = { ... };

function fetchUser() { ... }
function getProducts() { ... }
function loadOrderData() { ... }

// ✅ Consistent PascalCase for components
function UserCard() { ... }
function ProductList() { ... }
function OrderSummary() { ... }
```

---

### File Structure Consistency

**Bad**: Inconsistent organization

```
src/
├── UserProfile.tsx
├── components/ProductCard.tsx
├── OrderDetails.tsx
├── comp/ReviewList.tsx
└── forms/CheckoutForm.tsx
```

**Good**: Consistent structure

```
src/
├── components/
│   ├── UserProfile.tsx
│   ├── ProductCard.tsx
│   ├── OrderDetails.tsx
│   ├── ReviewList.tsx
│   └── CheckoutForm.tsx
├── hooks/
│   ├── useUser.ts
│   └── useProducts.ts
└── utils/
    └── api.ts
```

---

### API Pattern Consistency

**Bad**: Mixed API patterns

```typescript
// ❌ Inconsistent patterns
async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

function fetchProducts() {
  return fetch('/api/products').then(r => r.json());
}

const loadOrders = (userId) => {
  fetch(`/api/orders?user=${userId}`)
    .then(response => response.json())
    .then(data => setOrders(data));
};
```

**Good**: Consistent API pattern

```typescript
// ✅ Consistent async/await pattern
async function getUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

async function getProducts() {
  const response = await fetch('/api/products');
  return response.json();
}

async function getOrders(userId: string) {
  const response = await fetch(`/api/orders?user=${userId}`);
  return response.json();
}
```

---

## Inline Styles vs. Classes

**Bad**: Inline styles with hardcoded values

```tsx
// ❌ Inline styles break design system
<div style={{
  padding: '17px',
  backgroundColor: '#f0f0f0',
  borderRadius: '7px',
  marginBottom: '23px'
}}>
  Content
</div>
```

**Good**: Classes with design tokens

```tsx
// ✅ CSS classes use design system
<div className="p-4 bg-gray-100 rounded-md mb-6">
  Content
</div>

// Or with CSS modules
<div className={styles.card}>
  Content
</div>

// styles.module.css
.card {
  padding: var(--space-4);
  background-color: var(--color-gray-100);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
}
```

---

## CSS-in-JS with Tokens

**Bad**: Hardcoded values in styled-components

```typescript
// ❌ Hardcoded values
const Button = styled.button`
  background-color: #3b82f6;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
`;
```

**Good**: Design tokens in styled-components

```typescript
// ✅ Use theme tokens
const Button = styled.button`
  background-color: ${props => props.theme.colors.primary[600]};
  color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[6]};
  border-radius: ${props => props.theme.radii.md};
  font-size: ${props => props.theme.fontSizes.base};
`;

// Or with CSS variables
const Button = styled.button`
  background-color: var(--color-primary-600);
  color: var(--color-white);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
`;
```

---

## Red Flags to Look For

### 1. Duplication

```typescript
// 🚩 Nearly identical functions
function formatUserName(user) {
  return `${user.firstName} ${user.lastName}`;
}

function formatEmployeeName(employee) {
  return `${employee.firstName} ${employee.lastName}`;
}

// ✅ Extract shared logic
function formatFullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}
```

### 2. Magic Numbers

```css
/* 🚩 What do these numbers mean? */
.container {
  max-width: 1247px;
  padding: 17px 23px;
  margin-top: 41px;
}

/* ✅ Self-documenting with tokens */
.container {
  max-width: var(--container-max-width);  /* or 1200px */
  padding: var(--space-4) var(--space-6); /* 16px 24px */
  margin-top: var(--space-10);            /* 40px */
}
```

### 3. Inconsistent State Management

```typescript
// 🚩 Mixed state management approaches
const [user, setUser] = useState();           // React state
const products = useAtom(productsAtom);       // Jotai
const orders = useSelector(state => state.orders); // Redux

// ✅ Consistent approach
const [user, setUser] = useState();
const [products, setProducts] = useState();
const [orders, setOrders] = useState();

// Or all in Redux, or all in Zustand, etc.
```

### 4. Broken Abstraction

```typescript
// 🚩 Leaky abstraction - component knows too much
function UserCard({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`https://api.example.com/users/${userId}`)
      .then(r => r.json())
      .then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}

// ✅ Proper abstraction - component focused on UI
function UserCard({ user }) {
  return <div>{user.name}</div>;
}

// Data fetching handled by parent or hook
function UserProfile({ userId }) {
  const user = useUser(userId); // Custom hook handles fetching
  return <UserCard user={user} />;
}
```

---

## Checklist for Code Health Review

### Component Reuse
- [ ] No nearly-identical components in different files
- [ ] Shared components extracted to common location
- [ ] Component composition used appropriately
- [ ] Props used for variation, not duplication

### Design Tokens
- [ ] Colors use CSS variables or design system tokens
- [ ] Spacing follows consistent scale (e.g., 8px grid)
- [ ] Typography uses type scale
- [ ] Border radii consistent
- [ ] No magic numbers (random pixel values)

### Pattern Consistency
- [ ] Naming conventions consistent (camelCase vs PascalCase)
- [ ] File structure follows project conventions
- [ ] API calls use same pattern throughout
- [ ] State management approach consistent
- [ ] Import order and grouping consistent

### Abstraction Quality
- [ ] Components have single responsibility
- [ ] No leaky abstractions (components don't know too much)
- [ ] Appropriate separation of concerns
- [ ] Clear interfaces between layers

---

## Triage Priorities

**[High]** - Introduces technical debt or breaks patterns:
- Copy-pasted components with no extraction
- Hardcoded values that should use design tokens
- Inconsistent patterns that will spread
- Broken abstractions that couple unrelated concerns

**[Medium]** - Missed opportunities or minor inconsistencies:
- Could extract shared component but not critical
- Uses design tokens inconsistently
- Naming slightly off from conventions
- File organization suboptimal

**[Nitpick]** - Code style preferences:
- Prefer different variable name
- Could simplify but current code works
- Personal style preferences
- Minor organizational suggestions

---

## Tools for Code Health

### Linters
- **ESLint**: Enforce consistent code style
- **Prettier**: Auto-format code consistently
- **StyleLint**: CSS/SCSS consistency

### Design Token Validation
- **Design Lint** (Figma): Check design token usage
- **Style Dictionary**: Build design tokens
- **Theo** (Salesforce): Transform design tokens

### Code Quality
- **SonarQube**: Code quality and duplication detection
- **CodeClimate**: Maintainability analysis
- **Storybook**: Component isolation and testing

---

**For complete Code Health review procedures, return to [../SKILL.md Phase 6](../SKILL.md#phase-6-code-health).**
