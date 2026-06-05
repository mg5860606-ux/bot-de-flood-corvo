const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function relayWithBackoff(sock, dest, content, options = {}, opts = {}) {
    const maxRetries = typeof opts.maxRetries === 'number' ? opts.maxRetries : 6;
    const baseDelay  = typeof opts.baseDelay  === 'number' ? opts.baseDelay  : 3000; // 3s base

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await sock.relayMessage(dest, content, options);
        } catch (err) {
            const msg = (err && err.message) ? err.message.toLowerCase() : '';

            // Rate-limit: backoff exponencial
            if (msg.includes('rate-overlimit') || msg.includes('rate limited') || msg.includes('too many requests')) {
                const backoff = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 1000);
                console.log(`\x1b[33m[BACKOFF]\x1b[0m rate-overlimit (tentativa ${attempt + 1}/${maxRetries + 1}) — aguardando ${Math.round(backoff / 1000)}s...`);
                await wait(backoff);
                continue;
            }

            // Bad MAC / sessão corrompida: pula sem crashar
            if (msg.includes('bad mac') || msg.includes('failed to decrypt') || msg.includes('decryption')) {
                // silencioso — o Baileys já imprime no console
                return null;
            }

            // Erro transitório: retry com backoff suave
            if (attempt < maxRetries) {
                const backoff = baseDelay * Math.pow(1.5, attempt) + Math.floor(Math.random() * 500);
                console.log(`\x1b[33m[BACKOFF]\x1b[0m erro transitório (tentativa ${attempt + 1}/${maxRetries + 1}) — aguardando ${Math.round(backoff / 1000)}s... | ${err.message || err}`);
                await wait(backoff);
                continue;
            }

            // Desiste após maxRetries
            console.error(`\x1b[31m[BACKOFF]\x1b[0m desistindo após ${maxRetries + 1} tentativas:`, err.message || err);
            throw err;
        }
    }
}

module.exports = { relayWithBackoff };
