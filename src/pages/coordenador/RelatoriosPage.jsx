import React, { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import finalizaLogo from "../../assets/Group (1).png";
import {
  ApiError,
  getAllAlunos,
  getAllAreas,
  getAllBancas,
  getAllTccs,
} from "../../services/api";

const chartGreen = "#2f8f2b";
const chartGreenDark = "#23731f";
const chartAmber = "#f59e0b";
const chartRed = "#dc2626";
const chartSlate = "#64748b";

function errMessage(e, fallback) {
  if (e instanceof ApiError) return e.message;
  return e?.message || fallback;
}

function parseDate(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0] = value;
    return year && month && day
      ? new Date(year, month - 1, day, hour, minute)
      : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthLabel(date) {
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

function baseChartOptions(extra = {}) {
  return {
    chart: {
      fontFamily: "Inter, Arial, sans-serif",
      foreColor: "#475569",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
    },
    legend: {
      fontSize: "12px",
      labels: { colors: "#475569" },
      markers: { size: 6 },
    },
    tooltip: {
      theme: "light",
      style: { fontSize: "12px" },
    },
    ...extra,
  };
}

function statusLabel(status) {
  switch (status) {
    case "APROVADO":
      return "Aprovados";
    case "REPROVADO":
      return "Reprovados";
    case "EM_BANCA":
      return "Em banca";
    case "EM_DESENVOLVIMENTO":
      return "Em desenvolvimento";
    case "ARQUIVADO":
      return "Arquivados";
    default:
      return "Sem status";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "-";
}

function formatDateTime(value) {
  const date = parseDate(value);
  return date
    ? date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
}

function renderRows(rows, columns) {
  if (!rows.length) {
    return `<tr><td colspan="${columns.length}" class="empty">Sem dados para este relatorio.</td></tr>`;
  }

  return rows
    .map(
      (row) => `
        <tr>
          ${columns
            .map((column) => `<td>${escapeHtml(column.value(row))}</td>`)
            .join("")}
        </tr>
      `,
    )
    .join("");
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [tccs, setTccs] = useState([]);
  const [bancas, setBancas] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const [a, t, b, ar] = await Promise.all([
          getAllAlunos(),
          getAllTccs(),
          getAllBancas(),
          getAllAreas(),
        ]);
        if (!alive) return;
        setAlunos(Array.isArray(a) ? a : []);
        setTccs(Array.isArray(t) ? t : []);
        setBancas(Array.isArray(b) ? b : []);
        setAreas(Array.isArray(ar) ? ar : []);
      } catch (e) {
        toast.error(errMessage(e, "Erro ao carregar relatorios."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const totalTccs = tccs.length;
    const aprovados = tccs.filter((tcc) => tcc.status === "APROVADO").length;
    const reprovados = tccs.filter((tcc) => tcc.status === "REPROVADO").length;
    const emAndamento = tccs.filter(
      (tcc) => tcc.status === "EM_DESENVOLVIMENTO" || tcc.status === "EM_BANCA",
    ).length;
    const taxa = totalTccs ? Math.round((aprovados / totalTccs) * 100) : 0;

    return {
      aprovados,
      emAndamento,
      reprovados,
      taxa,
      totalTccs,
    };
  }, [tccs]);

  const statusChart = useMemo(() => {
    const order = [
      "EM_DESENVOLVIMENTO",
      "EM_BANCA",
      "APROVADO",
      "REPROVADO",
      "ARQUIVADO",
      "SEM_STATUS",
    ];
    const counts = new Map(order.map((status) => [status, 0]));

    for (const tcc of tccs) {
      const key = tcc.status || "SEM_STATUS";
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const items = order
      .map((status) => ({
        label: statusLabel(status),
        total: counts.get(status) || 0,
      }))
      .filter((item) => item.total > 0);

    return {
      labels: items.map((item) => item.label),
      series: items.map((item) => item.total),
    };
  }, [tccs]);

  const porArea = useMemo(() => {
    const map = new Map();
    map.set("Sem area", 0);

    for (const tcc of tccs) {
      const nome = tcc.areaNome || "Sem area";
      map.set(nome, (map.get(nome) || 0) + 1);
    }

    for (const area of areas) {
      const nome = area?.nome || area?.titulo || area?.descricao;
      if (nome && !map.has(nome)) map.set(nome, 0);
    }

    return Array.from(map.entries())
      .map(([area, qtd]) => ({ area, qtd }))
      .filter((item) => item.qtd > 0)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [areas, tccs]);

  const bancasPorMes = useMemo(() => {
    const map = new Map();

    for (const banca of bancas) {
      const date = parseDate(banca.data);
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = map.get(key) || { date, total: 0, finalizadas: 0 };
      current.total += 1;
      if (banca.notaFinal != null) current.finalizadas += 1;
      map.set(key, current);
    }

    return Array.from(map.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-6);
  }, [bancas]);

  const docRows = useMemo(() => {
    const comOrientador = tccs.filter((tcc) => !!tcc.orientadorId).length;
    const semOrientador = tccs.filter((tcc) => !tcc.orientadorId).length;

    return [
      {
        alert: semOrientador,
        doc: "TCCs com orientador associado",
        ok: comOrientador,
        total: tccs.length,
      },
      {
        alert: tccs.filter((tcc) => tcc.status === "REPROVADO").length,
        doc: "TCCs em banca / aprovados",
        ok: tccs.filter(
          (tcc) => tcc.status === "EM_BANCA" || tcc.status === "APROVADO",
        ).length,
        total: tccs.length,
      },
      {
        alert: bancas.filter((banca) => banca.notaFinal == null).length,
        doc: "Bancas cadastradas",
        ok: bancas.filter((banca) => banca.notaFinal != null).length,
        total: bancas.length,
      },
    ];
  }, [tccs, bancas]);

  function openPdfWindow(reportName) {
    const tccByAlunoId = new Map();
    for (const tcc of tccs) {
      if (tcc?.alunoId && !tccByAlunoId.has(tcc.alunoId)) {
        tccByAlunoId.set(tcc.alunoId, tcc);
      }
    }

    const reports = {
      "Lista de Alunos e Orientadores": {
        title: "Lista de Alunos e Orientadores",
        description:
          "Relacao de alunos cadastrados, TCC atual e vinculo de orientacao.",
        columns: [
          { label: "Aluno", value: (row) => row.nome || "-" },
          { label: "Matricula", value: (row) => row.matricula || "-" },
          { label: "E-mail", value: (row) => row.email || "-" },
          {
            label: "TCC",
            value: (row) => tccByAlunoId.get(row.id)?.titulo || "-",
          },
          {
            label: "Orientador",
            value: (row) => tccByAlunoId.get(row.id)?.orientadorNome || "-",
          },
          {
            label: "Status",
            value: (row) => statusLabel(tccByAlunoId.get(row.id)?.status),
          },
        ],
        rows: alunos,
      },
      "Status de TCCs (snapshot)": {
        title: "Status de TCCs",
        description: "Snapshot dos TCCs cadastrados e seus status atuais.",
        columns: [
          { label: "Titulo", value: (row) => row.titulo || "-" },
          { label: "Aluno", value: (row) => row.alunoNome || "-" },
          { label: "Orientador", value: (row) => row.orientadorNome || "-" },
          { label: "Area", value: (row) => row.areaNome || "-" },
          { label: "Status", value: (row) => statusLabel(row.status) },
          { label: "Inicio", value: (row) => formatDate(row.dataInicio) },
          { label: "Fim", value: (row) => formatDate(row.dataFim) },
        ],
        rows: tccs,
      },
      "Cronograma de Bancas (snapshot)": {
        title: "Cronograma de Bancas",
        description: "Bancas cadastradas com data, local e nota final.",
        columns: [
          { label: "Data", value: (row) => formatDateTime(row.data) },
          { label: "Local", value: (row) => row.local || "-" },
          { label: "TCC", value: (row) => row.tccTitulo || row.titulo || "-" },
          { label: "Aluno", value: (row) => row.alunoNome || "-" },
          {
            label: "Nota final",
            value: (row) => (row.notaFinal == null ? "-" : row.notaFinal),
          },
        ],
        rows: [...bancas].sort((a, b) => {
          const dateA = parseDate(a.data)?.getTime() || 0;
          const dateB = parseDate(b.data)?.getTime() || 0;
          return dateA - dateB;
        }),
      },
      "Relatorio de Notas (snapshot)": {
        title: "Relatorio de Notas",
        description: "Resumo de notas finais registradas nas bancas.",
        columns: [
          { label: "TCC", value: (row) => row.tccTitulo || row.titulo || "-" },
          { label: "Aluno", value: (row) => row.alunoNome || "-" },
          { label: "Data da banca", value: (row) => formatDate(row.data) },
          {
            label: "Nota final",
            value: (row) => (row.notaFinal == null ? "-" : row.notaFinal),
          },
          {
            label: "Situacao",
            value: (row) =>
              row.notaFinal == null
                ? "Pendente"
                : Number(row.notaFinal) >= 7
                  ? "Aprovado"
                  : "Reprovado",
          },
        ],
        rows: bancas,
      },
    };

    const report = reports[reportName];
    if (!report) return;

    const popup = window.open("", "_blank", "width=1100,height=800");
    if (!popup) {
      toast.error("Permita pop-ups no navegador para gerar o PDF.");
      return;
    }

    const generatedAt = new Date().toLocaleString("pt-BR");
    const logoSrc =
      finalizaLogo.startsWith("data:") || finalizaLogo.startsWith("http")
        ? finalizaLogo
        : new URL(finalizaLogo, window.location.origin).href;

    popup.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(report.title)} - Finaliza TCC</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f1f5f9;
              color: #0f172a;
              font-family: Inter, Arial, sans-serif;
            }
            .page {
              width: min(1120px, calc(100% - 32px));
              margin: 24px auto;
              background: #fff;
              border: 1px solid #dbe3ea;
              border-radius: 10px;
              padding: 30px;
            }
            header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              border-bottom: 3px solid #359830;
              padding-bottom: 18px;
              margin-bottom: 22px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .brand img {
              width: 58px;
              height: 58px;
              object-fit: contain;
            }
            h1 {
              margin: 0;
              font-size: 24px;
              line-height: 1.2;
            }
            .muted {
              color: #64748b;
              font-size: 12px;
              margin-top: 4px;
            }
            .actions {
              display: flex;
              gap: 8px;
            }
            button {
              border: 0;
              border-radius: 6px;
              background: #359830;
              color: #fff;
              cursor: pointer;
              font-weight: 700;
              padding: 10px 14px;
            }
            button.secondary {
              background: #e2e8f0;
              color: #334155;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 22px;
            }
            .metric {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
            }
            .metric strong {
              display: block;
              color: #359830;
              font-size: 22px;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th {
              background: #f8fafc;
              color: #334155;
              font-size: 11px;
              letter-spacing: .03em;
              text-align: left;
              text-transform: uppercase;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 9px 10px;
              vertical-align: top;
            }
            tr:nth-child(even) td {
              background: #fbfdff;
            }
            .empty {
              color: #64748b;
              padding: 24px;
              text-align: center;
            }
            footer {
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 11px;
              margin-top: 22px;
              padding-top: 12px;
            }
            @media print {
              body { background: #fff; }
              .page {
                width: 100%;
                margin: 0;
                border: 0;
                border-radius: 0;
                padding: 0;
              }
              .actions { display: none; }
              header { break-after: avoid; }
              table { page-break-inside: auto; }
              tr { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main class="page">
            <header>
              <div class="brand">
                <img src="${logoSrc}" alt="Finaliza TCC" />
                <div>
                  <h1>${escapeHtml(report.title)}</h1>
                  <div class="muted">${escapeHtml(report.description)}</div>
                  <div class="muted">Gerado em ${escapeHtml(generatedAt)}</div>
                </div>
              </div>
              <div class="actions">
                <button type="button" onclick="window.print()">Salvar PDF</button>
                <button type="button" class="secondary" onclick="window.close()">Fechar</button>
              </div>
            </header>

            <section class="summary">
              <div class="metric">Alunos<strong>${alunos.length}</strong></div>
              <div class="metric">TCCs<strong>${metrics.totalTccs}</strong></div>
              <div class="metric">Bancas<strong>${bancas.length}</strong></div>
              <div class="metric">Aprovacao<strong>${metrics.taxa}%</strong></div>
            </section>

            <table>
              <thead>
                <tr>
                  ${report.columns
                    .map((column) => `<th>${escapeHtml(column.label)}</th>`)
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${renderRows(report.rows, report.columns)}
              </tbody>
            </table>

            <footer>
              Finaliza TCC - documento gerado pelo painel da coordenacao.
            </footer>
          </main>
          <script>
            window.addEventListener("load", () => {
              setTimeout(() => window.print(), 350);
            });
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  const areaOptions = useMemo(
    () =>
      baseChartOptions({
        colors: [chartGreen],
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: "42%",
          },
        },
        xaxis: {
          categories: porArea.map((item) => item.area),
          labels: {
            rotate: -25,
            trim: true,
          },
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
        },
      }),
    [porArea],
  );

  const statusOptions = useMemo(
    () =>
      baseChartOptions({
        colors: [chartGreen, "#65b741", chartGreenDark, chartRed, chartSlate],
        labels: statusChart.labels,
        legend: {
          position: "bottom",
          fontSize: "12px",
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  show: true,
                  color: "#0f172a",
                  fontSize: "20px",
                  fontWeight: 700,
                  label: "TCCs",
                },
              },
            },
          },
        },
      }),
    [statusChart.labels],
  );

  const bancasOptions = useMemo(
    () =>
      baseChartOptions({
        colors: [chartGreen, chartAmber],
        stroke: {
          curve: "smooth",
          width: 3,
        },
        xaxis: {
          categories: bancasPorMes.map((item) => monthLabel(item.date)),
        },
        yaxis: {
          min: 0,
          forceNiceScale: true,
        },
      }),
    [bancasPorMes],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-10 text-center text-slate-500">
        Carregando indicadores...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Relatorios e Indicadores
        </h1>
        <p className="mt-1 text-slate-500">
          Gere relatórios e acompanhe o desempenho de estudantes, orientandores e tccs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          {
            icon: <TrendingUp size={20} />,
            label: "Taxa de aprovacao",
            value: `${metrics.taxa}%`,
          },
          {
            icon: <FileSpreadsheet size={20} />,
            label: "TCCs cadastrados",
            value: metrics.totalTccs,
          },
          {
            icon: <AlertCircle size={20} />,
            label: "TCCs reprovados",
            value: metrics.reprovados,
          },
          {
            icon: <Users size={20} />,
            label: "Alunos cadastrados",
            value: alunos.length,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {item.value}
              </p>
            </div>
            <div className="rounded-lg bg-[#eef8ed] p-3 text-[#2f8f2b]">
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-800">
              TCCs por area
            </h2>
          </div>
          <div className="p-4">
            {porArea.length ? (
              <Chart
                height={320}
                options={areaOptions}
                series={[
                  { data: porArea.map((item) => item.qtd), name: "TCCs" },
                ]}
                type="bar"
              />
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">
                Sem dados por area.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-800">
              Distribuicao por status
            </h2>
          </div>
          <div className="p-4">
            {statusChart.series.length ? (
              <Chart
                height={320}
                options={statusOptions}
                series={statusChart.series}
                type="donut"
              />
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">
                Sem TCCs cadastrados.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-800">
              Bancas por mes
            </h2>
          </div>
          <div className="p-4">
            {bancasPorMes.length ? (
              <Chart
                height={290}
                options={bancasOptions}
                series={[
                  {
                    data: bancasPorMes.map((item) => item.total),
                    name: "Bancas",
                  },
                  {
                    data: bancasPorMes.map((item) => item.finalizadas),
                    name: "Finalizadas",
                  },
                ]}
                type="line"
              />
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">
                Sem bancas com data cadastrada.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="flex items-center text-base font-bold text-slate-800">
              <Download size={18} className="mr-2 text-[#359830]" />
              Exportar dados
            </h2>
          </div>
          <div className="space-y-3 p-5">
            {[
              "Lista de Alunos e Orientadores",
              "Status de TCCs (snapshot)",
              "Cronograma de Bancas (snapshot)",
              "Relatorio de Notas (snapshot)",
            ].map((nome) => (
              <button
                key={nome}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#359830]/35 hover:bg-[#f8faf7]"
                onClick={() => openPdfWindow(nome)}
              >
                <span className="flex items-center text-sm font-semibold text-slate-700">
                  <FileText size={17} className="mr-3 text-[#359830]" />
                  {nome}
                </span>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-800">
            Checklist operacional
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3">Indicador</th>
                <th className="px-6 py-3 text-center">Universo</th>
                <th className="px-6 py-3 text-center">OK</th>
                <th className="px-6 py-3 text-center">Atencao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docRows.map((row) => (
                <tr
                  key={row.doc}
                  className="text-sm transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {row.doc}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">
                    {row.total}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-[#2f8f2b]">
                    {row.ok}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-red-500">
                    {row.alert}
                  </td>
                  <td className="px-6 py-4 text-right">

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
