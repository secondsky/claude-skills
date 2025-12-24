# Privacy & Compliance Guide

## GDPR Compliance

### Data Retention
**Default**: 2 years (730 days)

```json
{
  "privacy": {
    "transcripts": {
      "retention_days": 730
    },
    "audio": {
      "retention_days": 730
    }
  }
}
```

### Right to Be Forgotten
Enable data deletion requests:
```typescript
await client.conversations.delete(conversation_id);
```

### Data Residency
```typescript
const { startConversation } = useConversation({
  serverLocation: 'eu-residency' // GDPR-compliant EU data centers
});
```

### User Consent
Inform users before recording:
```json
{
  "first_message": "This call will be recorded for quality and training purposes. Do you consent?"
}
```

---

## HIPAA Compliance

### Data Retention
**Minimum**: 6 years (2190 days)

```json
{
  "privacy": {
    "transcripts": {
      "retention_days": 2190
    },
    "audio": {
      "retention_days": 2190
    }
  }
}
```

### Encryption
- **In Transit**: TLS 1.3 (automatic)
- **At Rest**: AES-256 (automatic)

### Business Associate Agreement (BAA)
Contact ElevenLabs for HIPAA BAA.

### PHI Handling
**Never**:
- Store PHI in dynamic variables
- Log PHI in tool parameters
- Send PHI to third-party tools without BAA

**Always**:
- Use secure authentication
- Verify patient identity
- Document access logs

---

## SOC 2 Compliance

### Security Controls
✅ Encryption in transit and at rest (automatic)
✅ Access controls (API key management)
✅ Audit logs (conversation history)
✅ Incident response (automatic backups)

### Best Practices
```json
{
  "authentication": {
    "type": "signed_url", // Most secure
    "session_duration": 3600 // 1 hour max
  }
}
```

---

## Regional Compliance

### US Residency
```typescript
serverLocation: 'us'
```

### EU Residency (GDPR)
```typescript
serverLocation: 'eu-residency'
```

### India Residency
```typescript
serverLocation: 'in-residency'
```

---

## Zero Retention Mode

**Maximum Privacy**: Immediately delete all data after conversation ends.

```json
{
  "privacy": {
    "zero_retention": true
  }
}
```

**Limitations**:
- No conversation history
- No analytics
- No post-call webhooks
- No MCP tool integrations

---

## PCI DSS (Payment Card Industry)

### Never:
❌ Store credit card numbers in conversation logs
❌ Send credit card data to LLM
❌ Log CVV or PIN numbers

### Always:
✅ Use PCI-compliant payment processors (Stripe, PayPal)
✅ Tokenize payment data
✅ Use DTMF keypad for card entry (telephony)

### Example: Secure Payment Collection
```json
{
  "system_tools": [
    {
      "name": "dtmf_playpad",
      "description": "Display keypad for secure card entry"
    }
  ]
}
```

---

## Compliance Checklist

### GDPR
- [ ] Data retention ≤ 2 years (or justify longer)
- [ ] EU data residency enabled
- [ ] User consent obtained before recording
- [ ] Data deletion process implemented
- [ ] Privacy policy updated

### HIPAA
- [ ] Data retention ≥ 6 years
- [ ] BAA signed with ElevenLabs
- [ ] Encryption enabled (automatic)
- [ ] Access logs maintained
- [ ] Staff trained on PHI handling

### SOC 2
- [ ] API key security (never expose in client)
- [ ] Use signed URLs for authentication
- [ ] Monitor access logs
- [ ] Incident response plan documented

### PCI DSS
- [ ] Never log card data
- [ ] Use tokenization for payments
- [ ] DTMF keypad for card entry
- [ ] PCI-compliant payment processor

---

## Monitoring & Auditing

### Access Logs
```typescript
const logs = await client.conversations.list({
  agent_id: 'agent_123',
  from_date: '2025-01-01',
  to_date: '2025-12-31'
});
```

### Compliance Reports
- Monthly conversation volume
- Data retention adherence
- Security incidents
- User consent rates

---

## Incident Response

### Data Breach Protocol
1. Identify affected conversations
2. Notify ElevenLabs immediately
3. Delete compromised data
4. Notify affected users (GDPR requirement)
5. Document incident
6. Review security controls

### Contact
security@elevenlabs.io
