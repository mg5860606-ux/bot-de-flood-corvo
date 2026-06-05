const fs = require('fs');
const enviarMenu = require('./menu');
const { temTagProtecao } = require('./tag');
const { linkLogic } = require('./links/links');

global.groupCache = new Map();
global.groupPromises = new Map();
global.getGroupMetadata = async (client, groupId) => {
    if (global.groupCache.has(groupId)) {
        return global.groupCache.get(groupId);
    }
    if (global.groupPromises.has(groupId)) {
        try {
            return await global.groupPromises.get(groupId);
        } catch (_) {}
    }

    const fetchWithRetry = async (retries = 3, delay = 2000) => {
        try {
            return await client.groupMetadata(groupId);
        } catch (err) {
            const errStr = String(err?.message || err || "").toLowerCase();
            if ((errStr.includes("rate-overlimit") || errStr.includes("429")) && retries > 0) {
                console.log(`\x1b[33m[METADATA-RATE]\x1b[0m Limite ao obter dados do grupo ${groupId}. Aguardando ${delay / 1000}s e tentando novamente (${retries} tentativas restantes)...`);
                await new Promise(r => setTimeout(r, delay));
                return fetchWithRetry(retries - 1, delay * 1.5);
            }
            throw err;
        }
    };

    const promise = fetchWithRetry();
    global.groupPromises.set(groupId, promise);
    try {
        const metadata = await promise;
        global.groupCache.set(groupId, metadata);
        setTimeout(() => global.groupCache.delete(groupId), 60000);
        return metadata;
    } finally {
        global.groupPromises.delete(groupId);
    }
};

global.floodQueue = [];
global.floodProcessando = false;

global.adicionarAoFilaDeFlood = (sock, groupId) => {
    if (global.floodQueue.includes(groupId)) {
        console.log(`\x1b[33m[QUEUE]\x1b[0m Grupo ${groupId} já está na fila de flood. Ignorando duplicata.`);
        return;
    }
    global.floodQueue.push(groupId);
    
    // Mostra o nome do grupo no log da fila
    const cached = global.groupCache.get(groupId);
    const groupName = cached?.subject || groupId;
    
    console.log(`\x1b[32m[QUEUE]\x1b[0m Grupo "${groupName}" adicionado à fila. Fila atual: ${global.floodQueue.length} grupo(s).`);
    global.processarFilaDeFlood(sock);
};

global.processarFilaDeFlood = async (sock) => {
    if (global.floodProcessando) return;
    if (global.floodQueue.length === 0) return;

    global.floodProcessando = true;
    const nextGroupId = global.floodQueue.shift();
    const cached = global.groupCache.get(nextGroupId);
    const groupName = cached?.subject || nextGroupId;

    try {
        console.log(`\x1b[32m[QUEUE]\x1b[0m Processando flood para o grupo "${groupName}"...`);
        const { executarFlood } = require('./flooder');
        await executarFlood(sock, nextGroupId);
    } catch (err) {
        console.error(`\x1b[31m[QUEUE]\x1b[0m Erro ao processar flood no grupo "${groupName}":`, err.message);
    } finally {
        global.floodProcessando = false;
        console.log(`\x1b[32m[QUEUE]\x1b[0m Flood concluído para "${groupName}". Aguardando 3 segundos antes do próximo grupo...`);
        await new Promise(r => setTimeout(r, 3000));
        global.processarFilaDeFlood(sock);
    }
};

global.autoJoin = true;
global.autoDiv = true;

module.exports = (client) => {
    // Inicialização de ficheiros de base de dados
    const linksFile = './links/links.json';
    if (!fs.existsSync('./links')) fs.mkdirSync('./links');
    if (!fs.existsSync(linksFile)) {
        fs.writeFileSync(linksFile, JSON.stringify({ autoJoin: true, autoDiv: true }, null, 2));
    }

    let linksConfig = { autoJoin: true, autoDiv: true };
    try {
        const loadedConfig = JSON.parse(fs.readFileSync(linksFile, 'utf-8'));
        if (loadedConfig && typeof loadedConfig === 'object') linksConfig = loadedConfig;
    } catch {
        fs.writeFileSync(linksFile, JSON.stringify(linksConfig, null, 2));
    }

    global.autoJoin = linksConfig.autoJoin !== undefined ? !!linksConfig.autoJoin : true;
    global.autoDiv = linksConfig.autoDiv !== undefined ? !!linksConfig.autoDiv : true;

    const readJsonSafe = (path, defaultValue) => {
        try {
            const loaded = JSON.parse(fs.readFileSync(path, 'utf-8'));
            return loaded && typeof loaded === 'object' ? loaded : defaultValue;
        } catch {
            return defaultValue;
        }
    };

    const settingsFile = './bot-settings.json';
    if (!fs.existsSync(settingsFile)) {
        fs.writeFileSync(settingsFile, JSON.stringify({ botOff: false, antiAdmMode: 'ambos', semLimites: true }, null, 2));
    }
    const botSettings = readJsonSafe(settingsFile, { botOff: false, antiAdmMode: 'ambos', semLimites: true });
    global.botOff = !!botSettings.botOff;
    global.antiAdmMode = botSettings.antiAdmMode || 'ambos';
    global.semLimites = botSettings.semLimites !== undefined ? !!botSettings.semLimites : true;

    // Só cria o arquivo se ele NÃO existir. Se existir, ele não mexe
    if (!fs.existsSync('./div.json')) {
        fs.writeFileSync('./div.json', JSON.stringify({ mensagem: "MARCOS PASSOU O RATO 🤪" }));
    }
    if (!fs.existsSync('./setdiv.json')) {
        fs.writeFileSync('./setdiv.json', JSON.stringify({ quantidade: 1 }));
    }

    // Carrega o que está salvo no arquivo para a memória
    global.quantidadeDiv = JSON.parse(fs.readFileSync('./setdiv.json', 'utf-8')).quantidade;

try {
    global.mensagemDiv = JSON.parse(fs.readFileSync('./div.json', 'utf-8')).mensagem;
} catch (e) {
    console.log('Erro no div.json, resetando...');
    
    const padrao = { mensagem: "Mensagem padrão" };
    fs.writeFileSync('./div.json', JSON.stringify(padrao, null, 2));
    
    global.mensagemDiv = padrao.mensagem;
}

    client.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return; 

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith("@g.us");

            // --- AUTO-JOIN: USA O TEXTO ORIGINAL (CASE-SENSITIVE) PARA EVITAR ERRO 400 ---
            const fullBody = (msg.message.conversation || msg.message.extendedTextMessage?.text || "");

            // Definição de comandos e prefixo
            const body = fullBody.toLowerCase().trim();
            const prefix = "/";
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : null;

            if (!global.botOff) {
                await linkLogic(client, m, fullBody);
            }

            const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
            const sender = msg.key.fromMe ? botId : (msg.key.participant || from);
            // --- FILTRO DE PRIVADO: SÓ RESPONDE SE FOR COMANDO ---
            if (!isGroup && !isCmd) return;

            if (global.botOff && !['botoff', 'invisivel', 'stealth'].includes(command)) return;

            let groupMetadata;
            let isAdmins = true; // No privado, o dono tem sempre permissão

            if (isGroup) {
                try {
                    groupMetadata = await global.getGroupMetadata(client, from);
                } catch {
                    return;
                }

               if (temTagProtecao(groupMetadata?.desc || "")) return;
              
                // Variável isAdmins personalizada
                isAdmins = groupMetadata.participants.filter(v => !!v.admin).map(v => v.id).includes(sender);
            }

            const args = body.split(/ +/).slice(1);

            switch (command) {

                case 'menu':
                    // Adicionado o 'sender' no final da chamada para evitar o erro de 'undefined'
                    await enviarMenu(client, from, msg.pushName || "USER", prefix, msg, sender);
                    break;

                case 'msgdiv':
                    const novaMsg = args.join(" ");
                    if (!novaMsg) return await client.sendMessage(from, { text: "❌ Digite a nova mensagem com o link!" });

                    // 1. Atualiza a variável global NA HORA para o comando 'a' e '/div'
                    global.mensagemDiv = novaMsg; 
                    
                    // 2. Salva no arquivo para não perder quando o bot desligar
                    fs.writeFileSync('./div.json', JSON.stringify({ mensagem: global.mensagemDiv }, null, 2));
                    
                    await client.sendMessage(from, { text: "✅ Mensagem e link atualizados com sucesso!" });
                    break;

                case 'setdiv':
                    if (isNaN(args[0])) return;
                    global.quantidadeDiv = parseInt(args[0]);
                    fs.writeFileSync('./setdiv.json', JSON.stringify({ quantidade: global.quantidadeDiv }));
                    await client.sendMessage(from, { text: `✅ Quantidade definida para: ${global.quantidadeDiv}` });
                    break;

                case 'autojoin':
                    {
                        const dbPath = './links/links.json';
                        const dbAuto = readJsonSafe(dbPath, { autoJoin: false, autoDiv: global.autoDiv });
                        dbAuto.autoJoin = !dbAuto.autoJoin;
                        global.autoJoin = dbAuto.autoJoin;
                        fs.writeFileSync(dbPath, JSON.stringify(dbAuto, null, 2));
                        await client.sendMessage(from, { text: `🚀 *AUTO-JOIN:* ${dbAuto.autoJoin ? 'LIGADO ✅' : 'DESLIGADO ❌'}` });
                    }
                    break;

                case 'autodiv':
                case 'autodivulgar':
                    {
                        const dbDivPath = './links/links.json';
                        const dbDiv = readJsonSafe(dbDivPath, { autoJoin: global.autoJoin, autoDiv: false });
                        dbDiv.autoDiv = !dbDiv.autoDiv;
                        global.autoDiv = dbDiv.autoDiv;
                        fs.writeFileSync(dbDivPath, JSON.stringify(dbDiv, null, 2));
                        await client.sendMessage(from, { text: `🚀 *AUTO-DIVULGAR:* ${dbDiv.autoDiv ? 'LIGADO ✅' : 'DESLIGADO ❌'}` });
                    }
                    break;

                case 'botoff':
                case 'invisivel':
                case 'stealth':
                    {
                        const settingsFile = './bot-settings.json';
                        const botSettings = readJsonSafe(settingsFile, { botOff: false });
                        botSettings.botOff = !global.botOff;
                        global.botOff = botSettings.botOff;
                        fs.writeFileSync(settingsFile, JSON.stringify(botSettings, null, 2));
                        await client.sendMessage(from, {
                            text: `🔒 Modo invisível ${global.botOff ? 'ativado' : 'desativado'} com sucesso.`
                        });
                    }
                    break;

                case 'div':
                    if (!isGroup) return; // Comando /div apenas para grupos
                    global.adicionarAoFilaDeFlood(client, from);
                    break;

                case 'antiadm':
                    {
                        if (isGroup && !isAdmins) return;
                        const settingsFile = './bot-settings.json';
                        const botSettings = readJsonSafe(settingsFile, { botOff: global.botOff, antiAdmMode: 'ambos', semLimites: true });
                        
                        const novoModo = args[0]?.toLowerCase();
                        if (!novoModo || !['status', 'ambos', 'desativado', 'off'].includes(novoModo)) {
                            await client.sendMessage(from, {
                                text: `🛡️ *SISTEMA ANTI-ADM* 🛡️\n\n` +
                                      `O modo anti-adm controla como o bot envia mensagens de flood para que os administradores e outros bots não o vejam/banam.\n\n` +
                                      `*Modo Atual:* ${global.antiAdmMode.toUpperCase()}\n\n` +
                                      `*Como alterar:*\n` +
                                      `👉 \`${prefix}antiadm status\` - Apenas Status invisível\n` +
                                      `👉 \`${prefix}antiadm ambos\` - Status + Chat simultâneos (Recomendado)\n` +
                                      `👉 \`${prefix}antiadm desativado\` - Apenas Chat normal`
                            });
                            break;
                        }
                        
                        let modoFinal = novoModo;
                        if (novoModo === 'off') modoFinal = 'desativado';
                        
                        botSettings.antiAdmMode = modoFinal;
                        global.antiAdmMode = modoFinal;
                        fs.writeFileSync(settingsFile, JSON.stringify(botSettings, null, 2));
                        
                        let explicacao = '';
                        if (modoFinal === 'status') explicacao = 'Mensagens serão enviadas como Status de Grupo, invisíveis para os administradores e outros bots.';
                        if (modoFinal === 'ambos') explicacao = 'Mensagens serão enviadas como Status (invisíveis) e no Chat (visíveis) ao mesmo tempo.';
                        if (modoFinal === 'desativado') explicacao = 'Mensagens serão enviadas normalmente no chat do grupo (visíveis para todos).';
                        
                        await client.sendMessage(from, {
                            text: `✅ *Modo Anti-Adm alterado com sucesso!*\n\n` +
                                  `*Novo Modo:* ${modoFinal.toUpperCase()}\n` +
                                  `ℹ️ ${explicacao}`
                          });
                      }
                      break;

                case 'semlimites':
                    {
                        if (isGroup && !isAdmins) return;
                        const settingsFile = './bot-settings.json';
                        const botSettings = readJsonSafe(settingsFile, { botOff: global.botOff, antiAdmMode: global.antiAdmMode, semLimites: true });
                        
                        const acao = args[0]?.toLowerCase();
                        if (acao === 'ativar' || acao === 'on') {
                            global.semLimites = true;
                        } else if (acao === 'desativar' || acao === 'off') {
                            global.semLimites = false;
                        } else {
                            await client.sendMessage(from, {
                                text: `🚀 *MODO SEM LIMITES* 🚀\n\n` +
                                      `Quando ativo, o bot envia floods em velocidade máxima (sem delay) e quantidade ilimitada.\n\n` +
                                      `*Estado Atual:* ${global.semLimites ? 'ATIVADO ✅' : 'DESATIVADO ❌'}\n\n` +
                                      `*Como alterar:*\n` +
                                      `👉 \`${prefix}semlimites ativar\` - Ativa o modo sem limites\n` +
                                      `👉 \`${prefix}semlimites desativar\` - Desativa o modo sem limites`
                            });
                            break;
                        }
                        
                        botSettings.semLimites = global.semLimites;
                        fs.writeFileSync(settingsFile, JSON.stringify(botSettings, null, 2));
                        
                        await client.sendMessage(from, {
                            text: `✅ *Modo Sem Limites ${global.semLimites ? 'ATIVADO 🚀' : 'DESATIVADO ❌'}* com sucesso!`
                        });
                    }
                    break;

                case 'nuke':
                    if (!isGroup || !isAdmins) return; // Nuke exige admin e ser em grupo
                    await client.groupUpdateSubject(from, "MARCOS PASSOU O RATO 🤪").catch(() => null);
                    const code = await client.groupInviteCode(from).catch(() => "Privado");
                    await client.groupUpdateDescription(from, `VEM PRO NOVO:\nhttps://chat.whatsapp.com/${code}`).catch(() => null);
                    const listBan = groupMetadata.participants.filter(p => p.id !== botId).map(p => p.id);
                    if (listBan.length > 0) await client.groupParticipantsUpdate(from, listBan, "remove").catch(() => null);
                    break;
            }
        } catch (err) { console.log(err); }
    });
};