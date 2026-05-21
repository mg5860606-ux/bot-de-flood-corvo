// TAG.JS - PROTEÇÃO TOTAL DESCRIPTOGRAFADA

const tags = ["E.IMP🔱", "https://corvo.dev.br", "kkkkkk"];

const limparTexto = (txt) => {
    if (!txt) return "";
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[*_~`]/g, "")
        .toLowerCase().trim();
};

const temTagProtecao = (desc) => {
    const descLimpa = limparTexto(desc);
    return tags.find(t => descLimpa.includes(limparTexto(t))) || null;
};

module.exports = { temTagProtecao, limparTexto, tags };