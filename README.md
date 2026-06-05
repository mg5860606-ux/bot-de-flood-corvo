<div align="center">
  <img src="./banner.png" alt="Corvo Flood Bot Banner" width="100%"/>

  <br/>
  <br/>

  <img src="https://img.shields.io/badge/version-2.0-red?style=for-the-badge&logo=github"/>
  <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge&logo=nodedotjs"/>
  <img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp"/>
  <img src="https://img.shields.io/badge/status-ATIVO-blueviolet?style=for-the-badge"/>

  <h1>🦅 CORVO FLOOD BOT V2.0 💣</h1>
  <p><b>Bot de WhatsApp de alta performance para divulgação em massa invisível e automática.</b></p>
  <p>Entra, floda 500 mensagens no chat + 100 no status, e sai. Tudo sem precisar de nenhum comando.</p>
</div>

---

## 🚀 Sobre o Projeto

O **Corvo Flood Bot V2.0** é um bot de WhatsApp desenvolvido com [Baileys](https://github.com/WhiskeySockets/Baileys) focado em **domínio total de grupos**. Ao entrar em qualquer grupo via link, o bot dispara automaticamente um flood massivo de mensagens — **500 no chat** e **100 no status** — de forma simultânea, invisível para administradores, com delay inteligente para evitar bloqueios.

> **Zero comandos. Zero gatilhos. Entra e já começa.**

---

## ⚡ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 🤖 **Flood Automático** | Ao entrar no grupo, o flood começa imediatamente sem nenhum comando |
| 💬 **500 msgs no Chat** | Envia 500 mensagens de divulgação diretamente no chat do grupo |
| 📡 **100 msgs no Status** | Envia 100 mensagens simultâneas via Status do grupo (ViewOnce) |
| 👻 **Invisível para Admins** | Mensagens encapsuladas em `groupStatusMessageV2` — admins não veem |
| 🛡️ **Anti-Ban Delay** | Delay aleatório de 150ms–300ms entre envios para simular comportamento humano |
| 🏃 **Hit & Run** | Sai automaticamente do grupo após o flood completo |
| 🔗 **Links Múltiplos** | Divulga até 3 links de grupos parceiros por mensagem |
| 🚫 **Anti-Trava** | Detecta tags de proteção na descrição do grupo e aborta automaticamente |

---

## 🛠️ Tecnologias

- **[Node.js](https://nodejs.org/)** — Runtime JavaScript
- **[Baileys (@whiskeysockets/baileys)](https://github.com/WhiskeySockets/Baileys)** — Conexão WebSocket com WhatsApp
- **[Pino](https://getpino.io/)** — Logger de alta performance

---

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/mg5860606-ux/bot-de-flood-corvo.git
cd bot-de-flood-corvo
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Inicie o bot
```bash
npm start
```

### 4. Conecte o número
Escolha entre:
- 📷 **QR Code** — escaneia com o WhatsApp
- 🔢 **Código de Pareamento** — digita o número e recebe o código

---

## ⚙️ Configuração

Edite o arquivo [`div.json`](./div.json) para personalizar a mensagem de divulgação e os links dos grupos parceiros:

```json
{
  "mensagem": "🚨 DROPOU GRUPO NOVO! 🚨\n...\n🔗 LINK 1:\nhttps://chat.whatsapp.com/SEU_LINK_AQUI"
}
```

---

## 🔄 Fluxo de Operação

```
Recebe convite de grupo
        │
        ▼
Entra no grupo automaticamente
        │
        ▼
Verifica tags de proteção
   (Se protegido → Sai)
        │
        ▼
Inicia flood simultâneo:
  ├─ 500x Chat (invisível para admins)
  └─ 100x Status (invisível para admins)
        │
   [delay 150-300ms entre cada envio]
        │
        ▼
Sai do grupo automaticamente
```

---

## ⚠️ Aviso Legal

Este projeto foi desenvolvido estritamente para **fins educacionais e de estudos** sobre a API do WhatsApp (Baileys) e comportamentos de WebSockets. O uso indevido deste software para spam em massa, invasão ou qualquer atividade que viole os Termos de Serviço do WhatsApp é de total responsabilidade do usuário. O criador **não se responsabiliza** por banimentos de números (chips) ou danos causados.

---

## 📝 Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Feito com 🖤 por <b>Marcos / Corvo Dev</b></p>
  <img src="https://img.shields.io/badge/%F0%9F%A6%85-CORVO%20DEV-black?style=for-the-badge"/>
</div>
