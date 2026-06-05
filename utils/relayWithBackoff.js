const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function relayWithBackoff(sock, dest, content, options = {}, opts = {}) {
    const maxRetries = typeof opts.maxRetries === 'number' ? opts.maxRetries : 6;
    const baseDelay = typeof opts.baseDelay === 'number' ? opts.baseDelay : 1500; // ms
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await sock.relayMessage(dest, content, options);
        } catch (err) {
            const msg = (err && err.message) ? err.message.toLowerCase() : '';
            // If it's a rate limit, wait with exponential backoff and retry
            if (msg.includes('rate-overlimit') || msg.includes('rate limited') || msg.includes('too many requests')) {
                const backoff = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 1000);
                console.log(`[relayWithBackoff] rate-overlimit detected, attempt=${attempt}, backing off ${backoff}ms`);
                await wait(backoff);
                continue;
            }

            // For session/decrypt issues (bad mac), log and give up on this message
            if (msg.includes('bad mac') || msg.includes('failed to decrypt')) {
                console.log('[relayWithBackoff] Decryption/session error (Bad MAC). Skipping message to avoid crash.');
                return null;
            }

            // For other recoverable socket errors, try a few times
            if (attempt < maxRetries) {
                const backoff = baseDelay * Math.pow(1.5, attempt) + Math.floor(Math.random() * 500);
                console.log(`[relayWithBackoff] transient error, attempt=${attempt}, retrying in ${Math.round(backoff)}ms`, err.message || err);
                await wait(backoff);
                continue;
            }

            // Give up
            console.error('[relayWithBackoff] fatal error, giving up:', err.message || err);
            throw err;
        }
    }
}

module.exports = { relayWithBackoff };
