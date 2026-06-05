const fs = require('fs');

module.exports = async (client, from, pushname, prefix, msg, sender) => {
    try {
        const donoBot = "Marcos"; 
        const nomeBot = "Marcos flood";

        const menuHacker = `
╭━━━〔 ✰ 愛 ✰ 〕━━━╮
┃ 🍷 𝖀𝕾𝖀𝕬́𝕽𝕴𝕺: ${pushname}
┃ 🍷 𝕯𝕺𝕹𝕺: ${donoBot}
┃ 🍷 𝕭𝕺𝕿: ${nomeBot}
╰━━━〔 ✰ 愛 ✰ 〕━━━╯

╭━━━〔 ✰ 🕷️ ✰ 〕━━━╮
      𝕮𝕺𝕸𝕬𝕹𝕯𝕺𝕾 
╰━━━〔 ✰ 🕷️ ✰ 〕━━━╯

╭━━━〔 ✰ 愛 ✰ 〕━━━╮
┃ 💀 → ${prefix}div
┃ 💀 → ${prefix}setdiv
┃ 💀 → ${prefix}msgdiv
┃ 💀 → ${prefix}antiadm
┃ 💀 → ${prefix}semlimites
┃ 💀 → ${prefix}nuke
┃ 💀 → ${prefix}autojoin
┃ 💀 → ${prefix}autodiv
┃ 💀 → ${prefix}botoff
╰━━━━━━
     𝕾/𝕻𝕽𝕰𝕱𝕴𝖃𝕺 
💀 → div | A
💀 → nuke|💀 
╰━━━〔 ✰ 愛 ✰ 〕━━━╯`.trim();

        // Envia apenas o texto do menu para todos verem normal
        await client.sendMessage(from, { 
            text: menuHacker,
            mentions: [sender] 
        }, { quoted: msg });

    } catch (err) {
        console.log("Erro no menu: " + err);
    }
};
