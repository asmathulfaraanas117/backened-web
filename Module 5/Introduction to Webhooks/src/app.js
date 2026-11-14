require('dotenv').config();

const express = require('express');
const { handleWebhook } = require('./webhookHandler');

const app = express();

app.post(
    '/webhooks',
    express.raw({ type: 'application/json' }),
    handleWebhook
);

module.exports = { app };

if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}