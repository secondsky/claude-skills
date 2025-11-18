# ElevenLabs Agents - Complete Error Catalog

This document contains all 17 documented errors and their solutions for ElevenLabs Agents Platform.

**Last Updated**: 2025-11-03
**Source**: Production deployments, ElevenLabs documentation

---

## Error 1: Missing Required Dynamic Variables

**Symptom**: "Missing required dynamic variables" error, no transcript generated

**Cause**: Dynamic variables referenced in prompts/messages but not provided at conversation start

**Solution**:
```typescript
const conversation = await client.conversations.create({
  agent_id: "agent_123",
  dynamic_variables: {
    user_name: "John",
    account_tier: "premium",
    // Provide ALL variables referenced in prompts
  }
});
```

**Source**: ElevenLabs Agents documentation, production issues

---

## Error 2: Case-Sensitive Tool Names

**Symptom**: Tool not executing, agent says "tool not found"

**Cause**: Tool name in config doesn't match registered name (case-sensitive)

**Solution**:
```json
// agent_configs/bot.json
{
  "agent": {
    "prompt": {
      "tool_ids": ["orderLookup"]  // Must match exactly
    }
  }
}

// tool_configs/order-lookup.json
{
  "name": "orderLookup"  // Match case exactly
}
```

**Source**: CLI tool configuration errors

---

## Error 3: Webhook Authentication Failures

**Symptom**: Webhook auto-disabled after failures

**Cause**:
- Incorrect HMAC signature verification
- Not returning 200 status code
- 10+ consecutive failures

**Solution**:
```typescript
// Always verify HMAC signature
import crypto from 'crypto';

const signature = req.headers['elevenlabs-signature'];
const payload = JSON.stringify(req.body);

const hmac = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== hmac) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// Process webhook
// ...

// MUST return 200
res.status(200).json({ success: true });
```

**Source**: Webhook integration failures in production

---

## Error 4: Voice Consistency Issues

**Symptom**: Generated audio varies in volume/tone

**Cause**:
- Background noise in voice clone training data
- Inconsistent microphone distance
- Whispering or shouting in samples

**Solution**:
- Use clean audio samples (no music, noise, pops)
- Maintain consistent microphone distance
- Avoid extreme volumes
- Test voice settings before deployment

**Source**: Voice cloning best practices

---

## Error 5: Wrong Language Voice

**Symptom**: Unpredictable pronunciation, accent issues

**Cause**: Using English-trained voice for non-English language

**Solution**:
```json
{
  "language_presets": [
    {
      "language": "es",
      "voice_id": "spanish_trained_voice_id"  // Must be Spanish-trained
    }
  ]
}
```

**Source**: Multi-language deployment issues

---

## Error 6: Restricted API Keys Not Supported (CLI)

**Symptom**: CLI authentication fails

**Cause**: Using restricted API key (not currently supported)

**Solution**: Use unrestricted API key for CLI operations

**Source**: ElevenLabs CLI limitations

---

## Error 7: Agent Configuration Push Conflicts

**Symptom**: Changes not reflected after push

**Cause**: Hash-based change detection missed modification

**Solution**:
```bash
# Force re-sync
elevenlabs agents init --override
elevenlabs agents pull  # Re-import from platform
# Make changes
elevenlabs agents push
```

**Source**: CLI sync issues

---

## Error 8: Tool Parameter Schema Mismatch

**Symptom**: Tool called but parameters empty or incorrect

**Cause**: Schema definition doesn't match actual usage

**Solution**:
```json
// tool_configs/order-lookup.json
{
  "parameters": {
    "type": "object",
    "properties": {
      "order_id": {
        "type": "string",
        "description": "The order ID to look up (format: ORD-12345)"  // Clear description
      }
    },
    "required": ["order_id"]
  }
}
```

**Source**: Tool integration debugging

---

## Error 9: RAG Index Not Ready

**Symptom**: Agent doesn't use knowledge base

**Cause**: RAG index still computing (can take minutes for large documents)

**Solution**:
```typescript
// Check index status before using
const index = await client.knowledgeBase.getRagIndex({
  document_id: 'doc_123'
});

if (index.status !== 'ready') {
  console.log('Index still computing...');
}
```

**Source**: Knowledge base integration

---

## Error 10: WebSocket Protocol Error (1002)

**Symptom**: Intermittent "protocol error" when using WebSocket connections

**Cause**: Network instability or incompatible browser

**Solution**:
- Use WebRTC instead of WebSocket (more resilient)
- Implement reconnection logic
- Check browser compatibility

**Source**: Connection reliability issues

---

## Error 11: 401 Unauthorized in Production

**Symptom**: Works locally but fails in production

**Cause**: Agent visibility settings or API key configuration

**Solution**:
- Check agent visibility (public vs private)
- Verify API key is set in production environment
- Check allowlist configuration if enabled

**Source**: Production deployment issues

---

## Error 12: Allowlist Connection Errors

**Symptom**: "Host elevenlabs.io is not allowed to connect to this agent"

**Cause**: Agent has allowlist enabled but using shared link

**Solution**:
- Configure agent allowlist with correct domains
- Or disable allowlist for testing

**Source**: Access control configuration

---

## Error 13: Workflow Infinite Loops

**Symptom**: Agent gets stuck in workflow, never completes

**Cause**: Edge conditions creating loops

**Solution**:
- Add max iteration limits
- Test all edge paths
- Add explicit exit conditions

**Source**: Workflow debugging

---

## Error 14: Burst Pricing Not Enabled

**Symptom**: Calls rejected during traffic spikes

**Cause**: Burst pricing not enabled in agent settings

**Solution**:
```json
{
  "call_limits": {
    "burst_pricing_enabled": true
  }
}
```

**Source**: Traffic spike handling

---

## Error 15: MCP Server Timeout

**Symptom**: MCP tools not responding

**Cause**: MCP server slow or unreachable

**Solution**:
- Check MCP server URL is accessible
- Verify transport type (SSE vs HTTP)
- Check authentication token
- Monitor MCP server logs

**Source**: MCP integration issues

---

## Error 16: First Message Cutoff on Android

**Symptom**: First message from agent gets cut off on Android devices (works fine on iOS/web)

**Cause**: Android devices need time to switch to correct audio mode after connection

**Solution**:
```typescript
import { useConversation } from '@elevenlabs/react';

const { startConversation } = useConversation({
  agentId: 'your-agent-id',

  // Add connection delay for Android
  connectionDelay: {
    android: 3_000,  // 3 seconds (default)
    ios: 0,          // No delay needed
    default: 0       // Other platforms
  },

  // Rest of config...
});
```

**Explanation**:
- Android needs 3 seconds to switch audio routing mode
- Without delay, first audio chunk is lost
- iOS and web don't have this issue
- Adjust delay if 3 seconds isn't sufficient

**Testing**:
```bash
# Test on Android device
npm run android

# First message should now be complete
```

**Source**: React Native production deployments

---

## Error 17: CSP (Content Security Policy) Violations

**Symptom**: "Refused to load the script because it violates the following Content Security Policy directive" errors in browser console

**Cause**: Applications with strict Content Security Policy don't allow `data:` or `blob:` URLs in `script-src` directive. ElevenLabs SDK uses Audio Worklets that are loaded as blobs by default.

**Solution - Self-Host Worklet Files**:

**Step 1**: Copy worklet files to your public directory:
```bash
# Copy from node_modules
cp node_modules/@elevenlabs/client/dist/worklets/*.js public/elevenlabs/
```

**Step 2**: Configure SDK to use self-hosted worklets:
```typescript
import { useConversation } from '@elevenlabs/react';

const { startConversation } = useConversation({
  agentId: 'your-agent-id',

  // Point to self-hosted worklet files
  workletPaths: {
    'rawAudioProcessor': '/elevenlabs/rawAudioProcessor.worklet.js',
    'audioConcatProcessor': '/elevenlabs/audioConcatProcessor.worklet.js',
  },

  // Rest of config...
});
```

**Step 3**: Update CSP headers to allow self-hosted scripts:
```nginx
# nginx example
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' https://elevenlabs.io;
  connect-src 'self' https://api.elevenlabs.io wss://api.elevenlabs.io;
  worker-src 'self';
" always;
```

**Worklet Files Location**:
```
node_modules/@elevenlabs/client/dist/worklets/
├── rawAudioProcessor.worklet.js
└── audioConcatProcessor.worklet.js
```

**Gotchas**:
- Worklet files must be served from same origin (CORS restriction)
- Update worklet files when upgrading `@elevenlabs/client`
- Paths must match exactly (case-sensitive)

**When You Need This**:
- Enterprise applications with strict CSP
- Government/financial apps
- Apps with security audits
- Any app blocking `blob:` URLs

**Source**: Enterprise security deployments

---

## Summary

**Total Errors Documented**: 17
**Categories**:
- Configuration: 7 errors (#1, #2, #5, #6, #8, #11, #12)
- Integration: 5 errors (#3, #9, #10, #14, #15)
- Platform-Specific: 3 errors (#4, #16, #17)
- Workflow: 2 errors (#7, #13)

**Prevention**: Always follow the quick start guides and test thoroughly before production deployment.
