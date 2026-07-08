export function getTccStatus(tcc, banca) {
  if (banca?.notaFinal != null) {
    return Number(banca.notaFinal) >= 7 ? "APROVADO" : "REPROVADO";
  }
  if (banca?.id) return "EM_BANCA";
  return tcc?.status || null;
}

export function getTccStatusLabel(status) {
  const labels = {
    EM_DESENVOLVIMENTO: "Em desenvolvimento",
    EM_BANCA: "Em banca",
    APROVADO: "Aprovado",
    REPROVADO: "Reprovado",
    ARQUIVADO: "Arquivado",
  };
  return labels[status] || (status ? String(status) : "-");
}

export function getBancaByTccId(bancas, tccId) {
  return (Array.isArray(bancas) ? bancas : []).find(
    (banca) => Number(banca?.tccId) === Number(tccId),
  );
}
