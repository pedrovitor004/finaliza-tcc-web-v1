import React from "react";
import { ClipboardList, Eye, FileSearch } from "lucide-react";
import toast from "react-hot-toast";

export default function TableTCCs({
  dados = [],
  titulo = "Trabalhos em Andamento",
}) {
  const brandGreen = "#359830";

  const getStatusBadge = (status) => {
    const statusMap = {
      "Em Andamento": "bg-[#359830]/10 text-[#359830] border-[#359830]/20",
      "Aguardando Avaliacao": "bg-yellow-100 text-yellow-700 border-yellow-200",
      Aprovado: "bg-green-100 text-green-700 border-green-200",
      Reprovado: "bg-red-100 text-red-700 border-red-200",
    };

    const cores =
      statusMap[status] || "bg-slate-100 text-slate-700 border-slate-200";

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${cores}`}
      >
        {status}
      </span>
    );
  };

  const showTccDetails = (tcc) => {
    toast.custom(
      (toastItem) => (
        <div
          className={`flex w-[360px] max-w-[calc(100vw-32px)] gap-3 rounded-lg border border-[#b8dfb5] bg-white p-4 text-left shadow-xl transition ${
            toastItem.visible
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#359830]/10 text-[#359830]">
            <ClipboardList size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              Detalhes do TCC
            </p>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Aluno:</span>{" "}
                {tcc.aluno || "-"}
              </p>
              {tcc.matricula && (
                <p>
                  <span className="font-semibold text-slate-800">
                    Matricula:
                  </span>{" "}
                  {tcc.matricula}
                </p>
              )}
              <p>
                <span className="font-semibold text-slate-800">Tema:</span>{" "}
                {tcc.tema || "-"}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Status:</span>{" "}
                {tcc.status || "-"}
              </p>
            </div>
          </div>
        </div>
      ),
      { duration: 5200 },
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">{titulo}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-semibold">Aluno</th>
              <th className="px-6 py-4 font-semibold">Tema do TCC</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Acoes</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {dados.length > 0 ? (
              dados.map((tcc, index) => (
                <tr
                  key={`${tcc.aluno}-${tcc.tema}-${index}`}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{tcc.aluno}</p>
                    {tcc.matricula && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mat: {tcc.matricula}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p
                      className="text-slate-800 text-sm line-clamp-2"
                      title={tcc.tema}
                    >
                      {tcc.tema}
                    </p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(tcc.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="inline-flex items-center justify-end gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold opacity-0 transition-all hover:bg-[#359830]/10 hover:brightness-95 group-hover:opacity-100"
                      style={{ color: brandGreen }}
                      onClick={() => showTccDetails(tcc)}
                      title={`Ver detalhes do TCC de ${tcc.aluno || "aluno"}`}
                    >
                      <Eye size={16} />
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <FileSearch size={40} className="text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-600">
                      Nenhum TCC encontrado
                    </p>
                    <p className="text-sm mt-1">
                      Os trabalhos aparecerao aqui quando forem cadastrados.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
