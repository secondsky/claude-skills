# Cloudflare Email Routing Complete Setup

Complete setup for receiving and sending emails via Cloudflare Workers.

---

## Part 1: Enable Email Routing (Dashboard)

**Prerequisites:** Domain on Cloudflare DNS

1. Dashboard → Your domain → **Email** → **Email Routing**
2. Click **Enable Email Routing** → **Add records and enable**
   - Automatically adds MX, SPF, DKIM records
3. Create destination address:
   - Custom address: `hello@yourdomain.com`
   - Destination: Your email (e.g., `you@gmail.com`)
   - Verify via email
4. ✅ Basic forwarding active

---

## Part 2: Receiving Emails (Email Workers)

### Install Dependencies

```bash
bun add postal-mime@2.5.0 mimetext@3.0.27
```

### Create Email Worker

```typescript
// src/email.ts
import { EmailMessage } from 'cloudflare:email';
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const parser = new PostalMime.default();
    const email = await parser.parse(await new Response(message.raw).arrayBuffer());

    console.log('From:', message.from);
    console.log('To:', message.to);
    console.log('Subject:', email.subject);
    console.log('Body:', email.text);

    // Forward to destination
    await message.forward('you@gmail.com');
  }
};
```

### Configure wrangler.jsonc

```jsonc
{
  "name": "email-worker",
  "main": "src/email.ts",
  "compatibility_date": "2025-10-11",
  "node_compat": true  // Required for postal-mime
}
```

### Deploy

```bash
npx wrangler deploy
```

### Connect Worker to Email Routing

1. Dashboard → Email → Email Routing → **Email Workers**
2. Click **Create address**
3. Custom address: `support@yourdomain.com`
4. Action: **Send to a Worker**
5. Destination Worker: Select your deployed worker
6. Save

---

## Part 3: Sending Emails (Send Email Binding)

### Add Destination Addresses

Dashboard → Email → Email Routing → **Destination addresses** → **Add**

Add addresses you want to send TO (must verify each).

### Configure Send Email Binding

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "send_email": [
    {
      "name": "SES",
      "destination_address": "user@example.com"
    }
  ]
}
```

### Send Email from Worker

```typescript
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export default {
  async fetch(request, env, ctx) {
    const msg = createMimeMessage();
    msg.setSender({ name: 'App', addr: 'noreply@yourdomain.com' });
    msg.setRecipient('user@example.com');
    msg.setSubject('Hello!');
    msg.addMessage({
      contentType: 'text/plain',
      data: 'This is the email body.'
    });

    const message = new EmailMessage('noreply@yourdomain.com', 'user@example.com', msg.asRaw());

    await env.SES.send(message);

    return new Response('Email sent!');
  }
};
```

---

## Common Patterns

### Allowlist

```typescript
const allowlist = ['approved@domain.com', 'trusted@example.com'];

if (!allowlist.includes(message.from)) {
  message.setReject('Not on allowlist');
  return;
}

await message.forward('you@gmail.com');
```

### Reply to Email

```typescript
const msg = createMimeMessage();
msg.setSender({ addr: 'noreply@yourdomain.com' });
msg.setRecipient(message.from);
msg.setSubject(`Re: ${email.subject}`);
msg.addMessage({
  contentType: 'text/plain',
  data: 'Thanks for your email!'
});

const reply = new EmailMessage('noreply@yourdomain.com', message.from, msg.asRaw());

await env.SES.send(reply);
```

---

## Production Checklist

- [ ] MX records added and verified
- [ ] Destination addresses verified
- [ ] node_compat: true in wrangler.jsonc
- [ ] postal-mime and mimetext installed
- [ ] Email worker deployed
- [ ] Worker connected to email address
- [ ] Send email binding configured (if sending)
- [ ] Destination addresses added for sending
- [ ] Error handling implemented
- [ ] Logging configured

---

## Official Documentation

- **Email Routing**: https://developers.cloudflare.com/email-routing/
- **Email Workers**: https://developers.cloudflare.com/email-routing/email-workers/
- **Send Email**: https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
