const { temTagProtecao } = require('./tag');

const verificarAntesDeEntrar = async (sock, inviteCode) => {
    try {
        const gMeta = await sock.groupGetInviteInfo(inviteCode);

        if (!gMeta) {
            console.log(`\x1b[31m[ERRO]\x1b[0m Não foi possível obter info do grupo.`);
            return { entrou: false, protegido: false, nome: null, tag: null };
        }

        const desc = gMeta.desc || gMeta.description || "";
        const nome = gMeta.subject || "Desconhecido";
        const tagEncontrada = temTagProtecao(desc);

        if (tagEncontrada) {
            console.log(`\x1b[33m[BLOQUEADO]\x1b[0m Grupo "\x1b[32m${nome}\x1b[0m" está protegido. Entrada cancelada.`);
            return { entrou: false, protegido: true, nome, tag: tagEncontrada };
        }

        // Verifica se o bot já está no grupo
        let jaEstava = false;
        try {
            await sock.groupMetadata(gMeta.id);
            jaEstava = true;
        } catch (_) {
            jaEstava = false;
        }

        if (jaEstava) {
            console.log(`\x1b[32m[OK]\x1b[0m O bot já está no grupo "${nome}". Realizando flood...`);
            return { entrou: true, jaEstava: true, protegido: false, nome, tag: null, groupId: gMeta.id };
        }

        console.log(`\x1b[32m[OK]\x1b[0m Grupo "${nome}" liberado. Entrando...`);
        await sock.groupAcceptInvite(inviteCode);
        return { entrou: true, jaEstava: false, protegido: false, nome, tag: null, groupId: gMeta.id };

    } catch (err) {
        console.error(`\x1b[31m[ERRO]\x1b[0m Falha ao verificar grupo:`, err.message);
        return { entrou: false, protegido: false, nome: null, tag: null };
    }
};

const monitorarEntradaEmGrupos = (sock) => {
    sock.ev.on("group-participants.update", async (update) => {
        if (global.botOff) return;

        const { id, participants, action, author } = update;

        const botId = sock.user.id.split(":")[0];
        const botEntrou = participants.some(p => p?.split?.(":")[0] === botId) && action === "add";


        if (!botEntrou) return;

        try {
            const gMeta = await sock.groupMetadata(id);
            const desc = gMeta?.desc || gMeta?.description || "";

            if (temTagProtecao(desc)) {
                console.log(`\x1b[33m[PROTEÇÃO]\x1b[0m Grupo protegido "\x1b[32m${gMeta?.subject}\x1b[0m". Saindo...`);
                await sock.groupLeave(id);
                console.log(`\x1b[31m[SAIU]\x1b[0m Saiu do grupo "${gMeta?.subject}".`);
                return;
            }

            console.log(`\x1b[32m[AUTO-DIV]\x1b[0m Iniciando divulgação automática no grupo "${gMeta?.subject}"...`);
            const { executarFlood } = require('./flooder');
            executarFlood(sock, id).catch(err => console.error("Erro na auto-divulgação:", err));

        } catch (err) {
            console.error(`\x1b[31m[ERRO]\x1b[0m`, err.message);
            try { await sock.groupLeave(id); } catch (_) {}
        }
    });
};

module.exports = { verificarAntesDeEntrar, monitorarEntradaEmGrupos };