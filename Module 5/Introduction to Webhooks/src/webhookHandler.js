const crypto = require('node:crypto');
const { handleEvent } = require('./eventHandlers');

// Store processed event IDs
const processedIds = new Set();

function handleWebhook(req, res) {
    // 1. Get the signature from the request header
    const signature = req.headers['x-webhook-signature'];

    // 2. Reject if signature is missing or invalid
    if (!signature || !signature.startsWith('sha256=')) {
        return res.status(401).json({
            error: 'Invalid signature'
        });
    }

    // 3. Calculate HMAC-SHA256 using the raw request body
    const expected = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(req.body)
        .digest('hex');

    // 4. Extract received signature
    const received = signature.slice(7);

    // Check signature format and length before comparison
    if (!/^[a-fA-F0-9]{64}$/.test(received)) {
        return res.status(401).json({
            error: 'Invalid signature'
        });
    }

    // 5. Compare signatures safely
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(received, 'hex');

    const isValid = crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
    );

    if (!isValid) {
        return res.status(401).json({
            error: 'Invalid signature'
        });
    }

    // 6. Parse the body after signature verification
    const event = JSON.parse(req.body.toString());

    // 7. Check for duplicate events
    if (processedIds.has(event.id)) {
        return res.status(200).json({
            status: 'already_processed'
        });
    }

    // 8. Mark event as processed
    processedIds.add(event.id);

    // 9. Send response immediately
    res.status(200).json({
        status: 'received'
    });

    // 10. Process event after sending response
    setImmediate(() => {
        handleEvent(event);
    });
}

// Export handler and processed IDs
module.exports = {
    handleWebhook,
    _processedIds: processedIds
};