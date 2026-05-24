<div align="center">
  <img src="https://i.imgur.com/vH9v5cI.png" alt="Corvo" width="150"/>
  <h1>🦅 MARCOS FLOOD CORVO V1.0 💣</h1>
  <p><b>Bot de WhatsApp focado em Divulgação em Massa (Hit & Run) invisível.</b></p>
</div>

---

## 🚀 Sobre o Projeto
O **Marcos Flood Corvo** é um bot de WhatsApp de alta performance criado para dominar a divulgação. Ele possui um sistema automático de "Hit and Run", onde o bot entra através de um link de convite, realiza um flood de mensagens invisíveis de Status (mencionando todos os participantes sem notificar administradores), e sai automaticamente do grupo para evitar banimentos e bloqueios.

## 🔥 Principais Funcionalidades

- 👻 **Menção Fantasma (Status Invisible):** Posta as mensagens diretamente no Status do grupo. O bot menciona todos os usuários para chamar atenção, mas esconde a menção dos administradores, dificultando que saibam quem enviou.
- 🏃‍♂️💨 **Sistema Hit & Run (Auto-Leave):** Entra no grupo, faz o ataque (25 mensagens seguidas) e sai automaticamente antes que os administradores possam reportar o número.
- 🛡️ **Delay Anti-Ban (Jitter):** Para fugir dos algoritmos do WhatsApp, o bot não envia mensagens em intervalos exatos. Ele sorteia um delay aleatório entre 1.0s e 2.5s a cada envio, simulando comportamento humano.
- 🔗 **Links Múltiplos:** Organização perfeita para divulgar até 3 links de grupos parceiros de uma só vez na mensagem do status.
- 🚫 **Anti-Trava/Proteção de Tags:** O bot lê a descrição dos grupos antes de agir. Se encontrar tags de proteção (como `E.IMP🔱`, `corvo.dev.br`), o bot bloqueia a própria entrada ou aborta a missão para não perder o número em grupos de travas.

## 🛠️ Tecnologias Utilizadas
- [Node.js](https://nodejs.org/) - Ambiente de execução JavaScript.
- [Baileys (@whiskeysockets/baileys)](https://github.com/WhiskeySockets/Baileys) - Biblioteca de conexão com o WhatsApp via WebSockets.

## 📦 Como Instalar e Rodar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/mg5860606-ux/bot-de-flood-corvo.git
   cd bot-de-flood-corvo
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o Bot:**
   ```bash
   npm start
   ```

4. **Conexão:**
   Escolha conectar via **QR Code** ou **Código de Pareamento** (digitando o número de telefone).

## ⚠️ Aviso Legal
Este projeto foi desenvolvido estritamente para **fins educacionais e de estudos** sobre a API do WhatsApp (Baileys) e comportamentos de WebSockets. O uso indevido deste software para spam em massa, invasão ou qualquer atividade que viole os Termos de Serviço do WhatsApp é de total responsabilidade do usuário. O criador não se responsabiliza por banimentos de números (chips) ou danos causados.

## 📝 Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
