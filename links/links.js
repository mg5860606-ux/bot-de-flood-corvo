const fs = require('fs');
const { verificarAntesDeEntrar } = require('../join-handler');

const readJsonSafe = (path, defaultValue) => {
    try {
        const loaded = JSON.parse(fs.readFileSync(path, 'utf-8'));
        return loaded && typeof loaded === 'object' ? loaded : defaultValue;
    } catch {
        return defaultValue;
    }
};

const linkLogic = async (client, m, body) => {
    if (global.botOff) return;

    const config = readJsonSafe('./links/links.json', { autoJoin: false, autoDiv: false });
    const autoJoin = !!config.autoJoin;
    const autoDiv = !!config.autoDiv;

    // Se nenhuma das funções estiver ativa, não faz nada
    if (!autoJoin && !autoDiv) return;

    const msg = m.messages[0];
    const from = msg.key.remoteJid;

    const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
        const code = match[1].trim();

        if (code.length >= 20) {
            try {
                // --- AUTO-JOIN ---
                if (autoJoin) {
                    const resultado = await verificarAntesDeEntrar(client, code);

                    if (resultado.entrou) {
                        console.log(`\x1b[32m>> [AUTO-JOIN] Sucesso: Entrei no grupo "${resultado.nome}"!\x1b[0m`);
                        await client.sendMessage(from, { text: `✅ *AUTO-JOIN:* Entrei no grupo *${resultado.nome}* com sucesso!` });

                        // Se o auto-div também estiver ativo, divulga no grupo recém-entrado
                        if (autoDiv && resultado.groupId) {
                            console.log(`\x1b[32m>> [AUTO-DIV] Divulgando no grupo "${resultado.nome}"...\x1b[0m`);
                            const { executarFlood } = require('../flooder');
                            executarFlood(client, resultado.groupId).catch(err =>
                                console.error("Erro na auto-divulgação após join:", err.message)
                            );
                        }

                    } else if (resultado.protegido) {
                        console.log(`\x1b[33m>> [AUTO-JOIN] Bloqueado: Grupo protegido.\x1b[0m`);
                        await client.sendMessage(from, { text: `🔒 *AUTO-JOIN:* Grupo *${resultado.nome}* protegido pela tag parceira *${resultado.tag}*! Entrada cancelada.` });
                    }

                // --- APENAS AUTO-DIV (sem auto-join) ---
                } else if (autoDiv) {
                    console.log(`\x1b[33m>> [AUTO-DIV] Ignorado: autoDiv requer autoJoin para entrar no grupo.\x1b[0m`);
                    await client.sendMessage(from, {
                        text: `⚠️ *AUTO-DIV:* Auto-divulgar direto não é suportado. Ative /autojoin para entrar no grupo antes de divulgar.`
                    });
                }

            } catch (e) {
                const errorMsg = e.toString().toLowerCase();

                if (errorMsg.includes('410') || errorMsg.includes('not-authorized')) {
                    console.log(`\x1b[31m>> [AUTO-JOIN] Falha: Link inválido "${code}".\x1b[0m`);
                    await client.sendMessage(from, { text: `❌ *AUTO-JOIN:* Link inválido ou redefinido.` });
                } else if (errorMsg.includes('403')) {
                    console.log(`\x1b[31m>> [AUTO-JOIN] Falha: Banido "${code}".\x1b[0m`);
                    await client.sendMessage(from, { text: `🚫 *AUTO-JOIN:* Fui banido desse grupo.` });
                } else if (errorMsg.includes('400') || errorMsg.includes('bad-request')) {
                    console.log(`\x1b[33m>> [AUTO-JOIN] Erro 400: Link malformado "${code}".\x1b[0m`);
                    await client.sendMessage(from, { text: `⚠️ *AUTO-JOIN:* Link malformado ou inválido.` });
                } else {
                    console.log(`\x1b[33m>> [AUTO-JOIN] Erro: ${e.message}\x1b[0m`);
                    await client.sendMessage(from, { text: `⚠️ *AUTO-JOIN:* Erro ao tentar entrar: ${e.message}` });
                }
            }
        }
    }
};

module.exports = { linkLogic };