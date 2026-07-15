import fetchClient, { ApiError, apiClient } from "./httpClient";
import { getStoredUser } from "../lib/session";

export { ApiError };

// Usuarios e autenticacao
export const login = (email, senha) =>
  fetchClient("/auth/login", { method: "POST", body: { email, senha } });

export const getAuthenticatedUser = () => fetchClient("/auth/me");

export const logoutSession = () =>
  fetchClient("/auth/logout", { method: "POST" });

export const getUsuario = () => getStoredUser();

export const registerUsuario = (data) =>
  fetchClient("/auth/register", { method: "POST", body: data });

export const updateUsuario = (id, data) =>
  fetchClient(`/usuarios/${id}`, { method: "PUT", body: data });

// Alunos
export const getAluno = (id) =>
  getStoredUser()?.tipo === "ALUNO"
    ? getMeuPerfilAluno()
    : fetchClient(`/alunos/${id}`);
export const getMeuPerfilAluno = () => fetchClient("/alunos/me");
export const createAluno = (data) =>
  fetchClient("/alunos/create", { method: "POST", body: data });
export const registerAluno = createAluno;
export const getAllAlunos = () => fetchClient("/alunos");
export const updateAluno = (id, data) =>
  getStoredUser()?.tipo === "ALUNO"
    ? updateMeuPerfilAluno(data)
    : fetchClient(`/alunos/${id}`, { method: "PUT", body: data });
export const updateMeuPerfilAluno = (data) =>
  fetchClient("/alunos/me", { method: "PUT", body: data });
export const deleteAluno = (id) =>
  fetchClient(`/alunos/${id}`, { method: "DELETE" });

// Professores
export const getProfessor = (id) =>
  getStoredUser()?.tipo === "PROFESSOR"
    ? getMeuPerfilProfessor()
    : fetchClient(`/professores/${id}`);
export const getMeuPerfilProfessor = () => fetchClient("/professores/me");
export const getAllProfessores = () =>
  getStoredUser()?.tipo === "ALUNO"
    ? fetchClient("/professores/orientadores")
    : fetchClient("/professores");
export const createProfessor = (data) =>
  fetchClient("/professores/create", { method: "POST", body: data });
export const registerProfessor = (data) =>
  fetchClient("/professores/register", { method: "POST", body: data });
export const updateProfessor = (id, data) =>
  getStoredUser()?.tipo === "PROFESSOR"
    ? updateMeuPerfilProfessor(data)
    : fetchClient(`/professores/${id}`, { method: "PUT", body: data });
export const updateMeuPerfilProfessor = (data) =>
  fetchClient("/professores/me", { method: "PUT", body: data });
export const deleteProfessor = (id) =>
  fetchClient(`/professores/${id}`, { method: "DELETE" });

// Coordenadores (professores com papel adicional de coordenacao)
export const getAllCoordenadores = () => fetchClient("/coordenadores");
export const createCoordenador = (data) =>
  fetchClient("/coordenadores", { method: "POST", body: data });
export const promoverProfessorCoordenador = (professorId) =>
  fetchClient(`/coordenadores/professores/${professorId}/promover`, {
    method: "PATCH",
  });

// TCCs
export const getAllTccs = () => fetchClient("/tccs");
export const getTcc = (id) => fetchClient(`/tccs/${id}`);
export const getMeuTcc = () => fetchClient("/tccs/me");
export const createTcc = (data) =>
  fetchClient("/tccs/create", { method: "POST", body: data });
export const getTccsByAluno = async (alunoId) => {
  if (getStoredUser()?.tipo !== "ALUNO") {
    return fetchClient(`/tccs/aluno/${alunoId}`);
  }

  const tcc = await getMeuTcc();
  return tcc ? [tcc] : [];
};
export const getTccsByProfessor = (professorId) =>
  getStoredUser()?.tipo === "PROFESSOR"
    ? fetchClient("/tccs/professor/me")
    : fetchClient(`/tccs/professor/${professorId}`);
export const updateTcc = (id, data) =>
  fetchClient(`/tccs/${id}`, { method: "PUT", body: data });
export const updateMeuTcc = (data) =>
  fetchClient("/tccs/me", { method: "PUT", body: data });
export const deleteTcc = (id) =>
  fetchClient(`/tccs/${id}`, { method: "DELETE" });

// Submissoes
export const getSubmissoesByTcc = (tccId) => {
  const tipo = getStoredUser()?.tipo;
  if (tipo === "ALUNO") return getMinhasSubmissoes();
  if (tipo === "PROFESSOR") return getSubmissoesDoProfessor();
  return fetchClient(`/submissoes/tcc/${tccId}`);
};
export const getMinhasSubmissoes = () => fetchClient("/submissoes/me");
export const getSubmissoesDoProfessor = () =>
  fetchClient("/submissoes/professor");
export const createSubmissao = (data) =>
  fetchClient("/submissoes/create", { method: "POST", body: data });
export const updateSubmissao = (id, data) =>
  getStoredUser()?.tipo === "PROFESSOR"
    ? fetchClient(`/submissoes/${id}/status`, {
        method: "PATCH",
        body: { status: data.status },
      })
    : fetchClient(`/submissoes/${id}`, { method: "PUT", body: data });
export const deleteSubmissao = (id) =>
  fetchClient(`/submissoes/${id}`, { method: "DELETE" });

// Bancas
export const getAllBancas = () => {
  const tipo = getStoredUser()?.tipo;
  if (tipo === "ALUNO") return fetchClient("/bancas/me");
  if (tipo === "PROFESSOR") return fetchClient("/bancas/professor/me");
  return fetchClient("/bancas");
};
export const createBanca = (data) =>
  fetchClient("/bancas/create", { method: "POST", body: data });
export const getBancaByTcc = async (tccId) => {
  const tipo = getStoredUser()?.tipo;
  if (tipo === "ALUNO" || tipo === "PROFESSOR") {
    const bancas = await getAllBancas();
    return (Array.isArray(bancas) ? bancas : []).find(
      (banca) => Number(banca.tccId) === Number(tccId),
    ) || null;
  }
  return fetchClient(`/bancas/tcc/${tccId}`);
};
export const updateBanca = (id, data) =>
  getStoredUser()?.tipo === "PROFESSOR"
    ? fetchClient(`/bancas/${id}/nota-final`, {
        method: "PATCH",
        body: { notaFinal: data.notaFinal },
      })
    : fetchClient(`/bancas/${id}`, { method: "PUT", body: data });
export const deleteBanca = (id) =>
  fetchClient(`/bancas/${id}`, { method: "DELETE" });

// Feedbacks e avaliacoes
export const getFeedbacksBySubmissao = (id) =>
  fetchClient(`/feedbacks/submissao/${id}`);
export const getFeedbacksByTcc = (tccId) =>
  getStoredUser()?.tipo === "ALUNO"
    ? fetchClient("/feedbacks/me")
    : fetchClient(`/feedbacks/tcc/${tccId}`);
export const createFeedback = (data) =>
  fetchClient("/feedbacks/create", { method: "POST", body: data });
export const updateFeedback = (id, data) =>
  fetchClient(`/feedbacks/${id}`, { method: "PUT", body: data });
export const deleteFeedback = (id) =>
  fetchClient(`/feedbacks/${id}`, { method: "DELETE" });
export const getAllAvaliacoes = () => {
  const tipo = getStoredUser()?.tipo;
  if (tipo === "ALUNO") return fetchClient("/avaliacoes/me");
  if (tipo === "PROFESSOR") return fetchClient("/avaliacoes/professor/me");
  return fetchClient("/avaliacoes");
};
export const createAvaliacao = (data) =>
  fetchClient("/avaliacoes/create", { method: "POST", body: data });
export const updateAvaliacao = (id, data) =>
  fetchClient(`/avaliacoes/${id}`, { method: "PUT", body: data });
export const deleteAvaliacao = (id) =>
  fetchClient(`/avaliacoes/${id}`, { method: "DELETE" });

// Areas de pesquisa
export const getArea = (id) => fetchClient(`/areas-pesquisa/${id}`);
export const getAllAreas = () => fetchClient("/areas-pesquisa");
export const createArea = (data) =>
  fetchClient("/areas-pesquisa/create", { method: "POST", body: data });
export const updateArea = (id, data) =>
  fetchClient(`/areas-pesquisa/${id}`, { method: "PUT", body: data });
export const deleteArea = (id) =>
  fetchClient(`/areas-pesquisa/${id}`, { method: "DELETE" });

// Arquivos
export const getArquivos = () =>
  getStoredUser()?.tipo === "ALUNO"
    ? getMeusArquivos()
    : fetchClient("/arquivos");
export const getMeusArquivos = () => fetchClient("/arquivos/me");
export const getArquivosBySubmissao = (submissaoId) =>
  fetchClient(`/arquivos/submissao/${submissaoId}`);
export const createArquivo = (data) =>
  fetchClient("/arquivos/create", { method: "POST", body: data });
export const uploadArquivo = (data) =>
  fetchClient("/arquivos/create", { method: "POST", body: data });
export const uploadArquivoFile = (file, submissaoId, tipo = "MANUSCRITO") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("submissaoId", String(submissaoId));
  formData.append("tipo", tipo);

  return fetchClient("/arquivos/upload", { method: "POST", body: formData });
};

function filenameFromDisposition(disposition) {
  const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);

  return disposition?.match(/filename="?([^";]+)"?/i)?.[1] || null;
}

export const openArquivo = async (id) => {
  const response = await apiClient.get(`/arquivos/${id}/visualizar`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const saveArquivo = async (id) => {
  const { blob, filename } = await downloadArquivo(id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `arquivo-${id}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
export const downloadArquivo = async (id) => {
  const response = await apiClient.get(
    `/arquivos/${id}/download`,
    {
      responseType: "blob",
    }
  );

  return {
    blob: response.data,
    filename: filenameFromDisposition(response.headers["content-disposition"]),
  };
};

export const deleteArquivo = (id) =>
  fetchClient(`/arquivos/${id}`, { method: "DELETE" });

// Auditoria
export const getAuditorias = () => fetchClient("/auditorias");

// Avaliadores
export const getAllAvaliadores = () => fetchClient("/avaliadores");
export const createAvaliador = (data) =>
  fetchClient("/avaliadores/create", { method: "POST", body: data });
export const updateAvaliador = (id, data) =>
  fetchClient(`/avaliadores/${id}`, { method: "PUT", body: data });
export const deleteAvaliador = (id) =>
  fetchClient(`/avaliadores/${id}`, { method: "DELETE" });

export default fetchClient;
