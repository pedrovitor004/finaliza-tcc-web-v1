import { useEffect, useMemo, useState } from "react";
import { Crown, Loader2, Plus, Search, ShieldCheck, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import {
  createCoordenador,
  getAllCoordenadores,
  getAllProfessores,
  promoverProfessorCoordenador,
} from "../../services/api";

const emptyForm = {
  nome: "", email: "", senha: "", areaAtuacao: "", titulacao: "",
};

export default function CoordenadoresPage() {
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname.endsWith("/novo") ? "cadastro" : "lista");
  const [coordenadores, setCoordenadores] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [professorId, setProfessorId] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [coords, profs] = await Promise.all([
        getAllCoordenadores(),
        getAllProfessores(),
      ]);
      setCoordenadores(Array.isArray(coords) ? coords : []);
      setProfessores(Array.isArray(profs) ? profs : []);
    } catch (error) {
      toast.error(error?.message || "Erro ao carregar coordenadores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([getAllCoordenadores(), getAllProfessores()])
      .then(([coords, profs]) => {
        if (!active) return;
        setCoordenadores(Array.isArray(coords) ? coords : []);
        setProfessores(Array.isArray(profs) ? profs : []);
      })
      .catch((error) => {
        if (active) toast.error(error?.message || "Erro ao carregar coordenadores.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const coordenadorIds = useMemo(
    () => new Set(coordenadores.map((item) => Number(item.id))),
    [coordenadores],
  );
  const promoviveis = professores.filter(
    (item) => !coordenadorIds.has(Number(item.id)),
  );
  const filtrados = coordenadores.filter((item) =>
    `${item.nome} ${item.email}`.toLowerCase().includes(busca.toLowerCase()),
  );

  async function cadastrar(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createCoordenador(form);
      toast.success("Coordenador cadastrado com sucesso.");
      setForm(emptyForm);
      setTab("lista");
      await load();
    } catch (error) {
      toast.error(error?.message || "Erro ao cadastrar coordenador.");
    } finally { setSaving(false); }
  }

  async function promover() {
    if (!professorId) return;
    setSaving(true);
    try {
      await promoverProfessorCoordenador(professorId);
      toast.success("Professor promovido a coordenador. Ele manteve o papel de professor.");
      setProfessorId("");
      await load();
    } catch (error) {
      toast.error(error?.message || "Erro ao promover professor.");
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <ShieldCheck className="text-[#359830]" /> Gestão de Coordenadores
        </h1>
        <p className="mt-1 text-slate-500">
          Coordenadores também preservam todas as permissões e vínculos de professor.
        </p>
      </header>

      <div className="flex gap-2 border-b border-slate-200">
        {[["lista", "Listar coordenadores"], ["cadastro", "Cadastrar coordenador"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-3 text-sm font-semibold ${tab === id ? "border-b-2 border-[#359830] text-[#287d24]" : "text-slate-500"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#359830]"><Loader2 className="animate-spin" /></div>
      ) : tab === "lista" ? (
        <div className="space-y-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar coordenador..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-[#359830]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {filtrados.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-600"><Crown size={20} /></div>
                  <div><h2 className="font-bold text-slate-800">{item.nome}</h2><p className="text-sm text-slate-500">{item.email}</p></div>
                </div>
                <div className="mt-4 text-sm text-slate-600"><p>{item.areaAtuacao || "Área não informada"}</p><p>{item.titulacao || "Titulação não informada"}</p></div>
                <div className="mt-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Professor + Coordenador</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-slate-800"><UserPlus size={18} /> Promover professor existente</h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select value={professorId} onChange={(e) => setProfessorId(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5">
                <option value="">Selecione um professor</option>
                {promoviveis.map((item) => <option key={item.id} value={item.id}>{item.nome} — {item.email}</option>)}
              </select>
              <button onClick={promover} disabled={!professorId || saving} className="rounded-lg bg-[#359830] px-5 py-2.5 font-semibold text-white disabled:opacity-50">Promover</button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={cadastrar} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
          {[
            ["nome", "Nome completo", "text"], ["email", "E-mail", "email"],
            ["senha", "Senha (mínimo 8 caracteres)", "password"], ["areaAtuacao", "Área de atuação", "text"],
            ["titulacao", "Titulação", "text"],
          ].map(([name, label, type]) => (
            <label key={name} className="text-sm font-semibold text-slate-700">{label}
              <input name={name} type={type} minLength={name === "senha" ? 8 : undefined} required value={form[name]} onChange={(e) => setForm((current) => ({ ...current, [name]: e.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#359830]" />
            </label>
          ))}
          <div className="sm:col-span-2"><button disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#359830] px-5 py-2.5 font-semibold text-white disabled:opacity-50"><Plus size={18} /> {saving ? "Salvando..." : "Cadastrar coordenador"}</button></div>
        </form>
      )}
    </div>
  );
}
