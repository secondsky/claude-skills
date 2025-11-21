# PayPal Integration

Complete PayPal payment processing with Node.js.

```javascript
const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  return process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

const client = new paypal.core.PayPalHttpClient(environment());


class PayPalService {
  /**
   * Create a PayPal order
   */
  async createOrder(amount, currency = 'USD', description = 'Purchase') {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        },
        description
      }],
      application_context: {
        return_url: `${process.env.BASE_URL}/payment/success`,
        cancel_url: `${process.env.BASE_URL}/payment/cancel`,
        brand_name: 'Your Store',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW'
      }
    });

    const response = await client.execute(request);
    return {
      orderId: response.result.id,
      approvalUrl: response.result.links.find(l => l.rel === 'approve').href
    };
  }

  /**
   * Capture a PayPal payment after user approval
   */
  async capturePayment(orderId) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const response = await client.execute(request);

    if (response.result.status !== 'COMPLETED') {
      throw new Error(`Payment capture failed: ${response.result.status}`);
    }

    return {
      transactionId: response.result.purchase_units[0].payments.captures[0].id,
      status: response.result.status,
      amount: response.result.purchase_units[0].payments.captures[0].amount
    };
  }

  /**
   * Refund a captured payment
   */
  async refundPayment(captureId, amount = null) {
    const request = new paypal.payments.CapturesRefundRequest(captureId);

    const body = {};
    if (amount) {
      body.amount = {
        currency_code: 'USD',
        value: amount.toFixed(2)
      };
    }
    request.requestBody(body);

    const response = await client.execute(request);
    return {
      refundId: response.result.id,
      status: response.result.status
    };
  }

  /**
   * Get order details
   */
  async getOrder(orderId) {
    const request = new paypal.orders.OrdersGetRequest(orderId);
    const response = await client.execute(request);
    return response.result;
  }
}

module.exports = new PayPalService();
```

## Express Routes

```javascript
const express = require('express');
const router = express.Router();
const paypal = require('./paypal-service');

// Create order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, description } = req.body;
    const order = await paypal.createOrder(amount, currency, description);

    // Store order in database
    await db.orders.create({
      paypalOrderId: order.orderId,
      userId: req.user.id,
      amount,
      status: 'pending'
    });

    res.json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Capture payment (called after user approves)
router.post('/capture/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await paypal.capturePayment(orderId);

    // Update order in database
    await db.orders.update(
      { paypalOrderId: orderId },
      {
        status: 'completed',
        transactionId: result.transactionId,
        completedAt: new Date()
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

// Refund
router.post('/refund/:captureId', async (req, res) => {
  try {
    const { captureId } = req.params;
    const { amount } = req.body;
    const result = await paypal.refundPayment(captureId, amount);
    res.json(result);
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Success callback
router.get('/success', async (req, res) => {
  const { token } = req.query; // PayPal order ID
  res.redirect(`/checkout/confirmation?orderId=${token}`);
});

// Cancel callback
router.get('/cancel', (req, res) => {
  res.redirect('/checkout/cancelled');
});

module.exports = router;
```

## Webhook Handler

```javascript
const crypto = require('crypto');

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  // Verify webhook signature
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const transmissionSig = req.headers['paypal-transmission-sig'];

  // In production, verify the webhook signature
  // See PayPal documentation for full verification process

  const event = JSON.parse(req.body);

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handleCaptureCompleted(event.resource);
      break;
    case 'PAYMENT.CAPTURE.REFUNDED':
      await handleRefund(event.resource);
      break;
    case 'CHECKOUT.ORDER.APPROVED':
      await handleOrderApproved(event.resource);
      break;
    default:
      console.log('Unhandled event:', event.event_type);
  }

  res.status(200).send('OK');
});

async function handleCaptureCompleted(capture) {
  await db.orders.update(
    { transactionId: capture.id },
    { status: 'completed' }
  );
}
```

## Frontend Integration

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID"></script>
<script>
paypal.Buttons({
  createOrder: async () => {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 99.99 })
    });
    const data = await response.json();
    return data.orderId;
  },
  onApprove: async (data) => {
    const response = await fetch(`/api/payment/capture/${data.orderID}`, {
      method: 'POST'
    });
    const result = await response.json();
    if (result.status === 'COMPLETED') {
      window.location.href = '/checkout/success';
    }
  },
  onError: (err) => {
    console.error('PayPal error:', err);
    alert('Payment failed. Please try again.');
  }
}).render('#paypal-button-container');
</script>
```

## Dependencies

```json
{
  "@paypal/checkout-server-sdk": "^1.0.3"
}
```
