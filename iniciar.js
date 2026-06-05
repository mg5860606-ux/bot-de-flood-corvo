const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");

// ─── SUPRIME RUÍDO INTERNO DO BAILEYS (Bad MAC / Closing session) ─────────
const _origError = console.error.bind(console);
const _origLog   = console.log.bind(console);
const NOISE = ['bad mac', 'failed to decrypt', 'closing open session', 'closing session', 'failed to decrypt message', 'session error'];
const isNoise = (...args) => args.some(a => NOISE.some(n => String(a).toLowerCase().includes(n)));
console.error = (...args) => { if (!isNoise(...args)) _origError(...args); };
console.log   = (...args) => { if (!isNoise(...args)) _origLog(...args); };

const question = (text) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(text, (answer) => { rl.close(); resolve(answer); }));
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('mgqrcode');
    const { version } = await fetchLatestBaileysVersion();

    console.clear();
    console.log("\x1b[32m%s\x1b[0m", `
    ███╗   ███╗ █████╗  ██████╗  ██████╗  ██████╗ ███████╗
    ████╗ ████║██╔══██╗ ██╔══██╗██╔════╝ ██╔═══██╗██╔════╝
    ██╔████╔██║███████║ ██████╔╝██║      ██║   ██║███████╗
    ██║╚██╔╝██║██╔══██║ ██╔══██╗██║      ██║   ██║╚════██║
    ██║ ╚═╝ ██║██║  ██║ ██║  ██║╚██████╗╚██████╔╝███████║
    ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
    >> SISTEMA MARCOS FLOOD V1.0 - STATUS: ONLINE
    `);

    if (!state.creds.registered && !global.metodoEscolhido) {
        const metodo = await question("Escolha o método de conexão:\n1. QR Code\n2. Código de Pareamento\nDigite: ");
        global.metodoEscolhido = metodo;
    }

    // REMOVIDO: Configurações complexas de patchMessage e prioridade (Motor de velocidade)
    const client = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false, 
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Browser padrão estável
    });

    // --- LÓGICA DE PAREAMENTO CORRIGIDA ---
    if (!client.authState.creds.registered && global.metodoEscolhido === '2') {
        // Aguarda 3 segundos para o socket estabilizar antes de pedir o código
        setTimeout(async () => {
            let numero = await question("\nDigite o número com DDD (Ex: 55119xxxxxxxx):\n> ");
            numero = numero.replace(/[^0-9]/g, '').trim(); 
            
            if (!numero) {
                console.log("Número inválido.");
                process.exit();
            }

            try {
                const code = await client.requestPairingCode(numero, "MARCOS");
                console.log("\x1b[32m%s\x1b[0m", `\n[SISTEMA] CÓDIGO DE PAREAMENTO: ${code}\n`);
            } catch (err) {
                console.log("\x1b[31m%s\x1b[0m", "[!] Erro ao solicitar código: " + err);
            }
        }, 3000); 
    }

    client.ev.on("creds.update", saveCreds);

    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && global.metodoEscolhido === '1') {
            console.clear();
            console.log("\x1b[32m>> SISTEMA MARCOS FLOOD V1.0\x1b[0m");
            qrcode.generate(qr, { small: true });
            console.log("\x1b[33m%s\x1b[0m", "[!] Escaneie o QR Code acima para conectar.");
        }

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                connectToWhatsApp();
            } else {
                console.log("\x1b[31m%s\x1b[0m", "[!] Desconectado. Limpe a pasta 'mgqrcode' e tente novamente.");
                process.exit();
            }
        } else if (connection === "open") {
            console.log("\x1b[32m%s\x1b[0m", "\n[!] MARCOS FLOOD CONECTADO COM SUCESSO!");
            
            const { monitorarEntradaEmGrupos } = require('./join-handler');
            monitorarEntradaEmGrupos(client);

            // Inicia o flood automático em todos os grupos existentes
            (async () => {
                try {
                    console.log(`\x1b[33m[STARTUP]\x1b[0m Buscando grupos ativos...`);
                    const grupos = await client.groupFetchAllParticipating();
                    const jids = Object.keys(grupos);
                    
                    if (jids.length > 0) {
                        console.log(`\x1b[32m[STARTUP]\x1b[0m Encontrado(s) ${jids.length} grupo(s). Adicionando à fila sequencial...`);
                        const { temTagProtecao } = require('./tag');

                        for (const jid of jids) {
                            const metadata = grupos[jid];
                            const desc = metadata?.desc || metadata?.description || "";
                            
                            if (temTagProtecao(desc)) {
                                console.log(`\x1b[33m[STARTUP]\x1b[0m Grupo "${metadata?.subject || jid}" está protegido. Ignorando.`);
                                continue;
                            }

                            // Verifica blacklist pelo nome
                            const nomeGrupo = metadata?.subject || '';
                            const naBlacklist = (global.blacklistGrupos || []).some(b => b.toLowerCase() === nomeGrupo.toLowerCase());
                            if (naBlacklist) {
                                console.log(`\x1b[33m[STARTUP]\x1b[0m Grupo "${nomeGrupo}" está na blacklist. Pulando.`);
                                continue;
                            }

                            // Preenche o cache local antes do agendamento para mostrar os nomes reais nos logs de fila
                            global.groupCache.set(jid, metadata);

                            global.adicionarAoFilaDeFlood(client, jid);
                        }
                    } else {
                        console.log(`\x1b[33m[STARTUP]\x1b[0m Nenhum grupo ativo encontrado para flood de inicialização.`);
                    }
                } catch (err) {
                    console.error("Erro ao buscar grupos ativos no startup:", err.message);
                }
            })();
        }
    });

    // Chama os ficheiros de comando
    require('./index')(client);
    require('./main')(client);
}

connectToWhatsApp().catch(err => console.error(err));
