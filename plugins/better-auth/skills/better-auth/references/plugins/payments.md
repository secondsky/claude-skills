# better-auth Payment Plugins

Complete guide for payment integrations: Stripe and Polar.

---

## Stripe Integration

### Installation

```bash
bun add better-auth stripe
```

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { stripe } from "better-auth/plugins";
import Stripe from "stripe";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const auth = betterAuth({
  plugins: [
    stripe({
      stripeClient,
      // Webhook secret for event validation
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      // Sync user data to Stripe Customer
      syncUserToCustomer: true,
      // Map subscription status to user fields
      subscriptionConfig: {
        // Plans available
        plans: [
          {
            id: "pro",
            priceId: "price_xxx",
            features: ["feature1", "feature2"],
          },
          {
            id: "enterprise",
            priceId: "price_yyy",
            features: ["feature1", "feature2", "feature3"],
          },
        ],
      },
    }),
  ],
});
```

### Client Configuration

```typescript
import { stripeClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [stripeClient()],
});
```

### Create Checkout Session

```typescript
// Create Stripe Checkout for subscription
const { data } = await authClient.stripe.createCheckoutSession({
  planId: "pro",
  successUrl: "https://your-app.com/success",
  cancelUrl: "https://your-app.com/pricing",
});

// Redirect to Stripe Checkout
window.location.href = data.url;
```

### Customer Portal

```typescript
// Open Stripe Customer Portal for subscription management
const { data } = await authClient.stripe.createPortalSession({
  returnUrl: "https://your-app.com/settings",
});

window.location.href = data.url;
```

### Check Subscription Status

```typescript
// Get current subscription
const { data: subscription } = await authClient.stripe.getSubscription();

if (subscription?.status === "active") {
  console.log("Plan:", subscription.planId);
  console.log("Features:", subscription.features);
}
```

### Webhook Handler

```typescript
// Route: /api/stripe/webhook
app.post("/api/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  // better-auth handles webhook internally
  const result = await auth.api.stripe.handleWebhook({
    body: req.body,
    signature: sig,
  });

  res.json({ received: true });
});
```

### Webhook Events Handled

better-auth automatically handles:

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Creates subscription record |
| `customer.subscription.updated` | Updates subscription status |
| `customer.subscription.deleted` | Marks subscription as canceled |
| `invoice.payment_succeeded` | Updates payment status |
| `invoice.payment_failed` | Marks payment as failed |

### Access Control by Plan

```typescript
// Server-side middleware
const session = await auth.api.getSession({ headers: req.headers });

if (session?.subscription?.planId !== "pro") {
  return res.status(403).json({ error: "Pro plan required" });
}
```

---

## Polar Integration

Polar is an open-source alternative to Patreon/Stripe for developers.

### Installation

```bash
bun add better-auth @polar-sh/sdk
```

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { polar } from "better-auth/plugins";
import { Polar } from "@polar-sh/sdk";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

export const auth = betterAuth({
  plugins: [
    polar({
      polarClient,
      // Organization ID
      organizationId: process.env.POLAR_ORGANIZATION_ID!,
      // Webhook secret
      webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
      // Available products
      products: [
        {
          id: "supporter",
          priceId: "price_xxx",
          type: "subscription",
        },
        {
          id: "lifetime",
          priceId: "price_yyy",
          type: "one-time",
        },
      ],
    }),
  ],
});
```

### Client Configuration

```typescript
import { polarClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [polarClient()],
});
```

### Create Checkout

```typescript
// Create Polar Checkout
const { data } = await authClient.polar.createCheckout({
  productId: "supporter",
  successUrl: "https://your-app.com/success",
});

window.location.href = data.url;
```

### Check Subscription

```typescript
const { data: subscription } = await authClient.polar.getSubscription();

if (subscription?.status === "active") {
  console.log("Product:", subscription.productId);
}
```

### Webhook Handler

```typescript
// Route: /api/polar/webhook
app.post("/api/polar/webhook", async (req, res) => {
  const result = await auth.api.polar.handleWebhook({
    body: req.body,
    headers: req.headers,
  });

  res.json({ received: true });
});
```

---

## Usage-Based Billing

### Stripe Metered Billing

```typescript
stripe({
  stripeClient,
  subscriptionConfig: {
    plans: [
      {
        id: "api-usage",
        priceId: "price_metered_xxx",
        type: "metered",
      },
    ],
  },
}),

// Report usage
await auth.api.stripe.reportUsage({
  userId: session.user.id,
  quantity: 100,  // API calls used
  timestamp: Date.now(),
});
```

### Usage Tracking

```typescript
// Track API usage per request
app.use(async (req, res, next) => {
  const session = await auth.api.getSession({ headers: req.headers });

  if (session?.subscription?.type === "metered") {
    await auth.api.stripe.incrementUsage({
      userId: session.user.id,
      quantity: 1,
    });
  }

  next();
});
```

---

## Free Trials

### Stripe Trial

```typescript
stripe({
  subscriptionConfig: {
    plans: [
      {
        id: "pro",
        priceId: "price_xxx",
        trialDays: 14,  // 14-day free trial
      },
    ],
  },
}),
```

### Check Trial Status

```typescript
const { data: subscription } = await authClient.stripe.getSubscription();

if (subscription?.status === "trialing") {
  const trialEnd = new Date(subscription.trialEnd);
  console.log("Trial ends:", trialEnd);
}
```

---

## Common Patterns

### Feature Flags by Plan

```typescript
// shared/features.ts
export const PLAN_FEATURES = {
  free: ["basic-feature"],
  pro: ["basic-feature", "advanced-feature", "priority-support"],
  enterprise: ["basic-feature", "advanced-feature", "priority-support", "custom-integrations"],
};

// Usage
const subscription = await authClient.stripe.getSubscription();
const features = PLAN_FEATURES[subscription?.planId || "free"];

if (features.includes("advanced-feature")) {
  // Allow access
}
```

### Upgrade Prompts

```typescript
function FeatureGate({ feature, children }) {
  const { data: subscription } = useSubscription();
  const hasFeature = subscription?.features?.includes(feature);

  if (!hasFeature) {
    return (
      <UpgradePrompt
        feature={feature}
        requiredPlan="pro"
      />
    );
  }

  return children;
}
```

---

## Common Issues

### Stripe: "Webhook signature verification failed"
- Ensure raw body is passed (not parsed JSON)
- Verify webhook secret matches Dashboard setting
- Check webhook URL is accessible

### Stripe: "Customer not found"
- Enable `syncUserToCustomer: true`
- Verify user signed up after plugin was configured

### Polar: "Invalid organization"
- Check `organizationId` is correct
- Verify API token has organization access

### General: "Subscription not updating"
- Check webhook endpoint is registered
- Verify webhook events are enabled
- Check server logs for webhook errors

---

## Environment Variables

### Stripe

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Polar

```env
POLAR_ACCESS_TOKEN=pat_xxx
POLAR_ORGANIZATION_ID=org_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
```

---

## Official Resources

- Stripe Plugin: https://better-auth.com/docs/plugins/stripe
- Polar Plugin: https://better-auth.com/docs/plugins/polar
- Stripe Docs: https://stripe.com/docs
- Polar Docs: https://docs.polar.sh
