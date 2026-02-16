
import React, { useMemo, useState } from 'react';
import { 
  Download, 
  Printer, 
  Calendar, 
  ArrowRight, 
  X, 
  FileSpreadsheet, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  ChevronRight,
  ClipboardList,
  Target,
  BarChart3
} from 'lucide-react';
import { Faturamento, Despesa } from '../types';
import * as XLSX from 'xlsx';

interface RelatoriosProps {
  faturamentos: Faturamento[];
  despesas: Despesa[];
}

export const Relatorios: React.FC<RelatoriosProps> = ({ faturamentos, despesas }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date(0);
    const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();

    const fat = faturamentos.filter(f => {
      const d = new Date(f.data);
      return d >= start && d <= end;
    });
    
    const desp = despesas.filter(d => {
      const dt = new Date(d.data);
      return dt >= start && dt <= end;
    });
    
    return { fat, desp, start, end };
  }, [faturamentos, despesas, startDate, endDate]);

  const summary = useMemo(() => {
    const totalFat = filteredData.fat.reduce((acc, curr) => acc + curr.valor, 0);
    const totalDesp = filteredData.desp.reduce((acc, curr) => acc + curr.valor, 0);
    return {
      totalFat,
      totalDesp,
      lucro: totalFat - totalDesp,
      avgTicket: filteredData.fat.length > 0 ? totalFat / filteredData.fat.length : 0,
      countFat: filteredData.fat.length,
      countDesp: filteredData.desp.length
    };
  }, [filteredData]);

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const resumoData = [
      ["EXTRATO DE PERFORMANCE - LAVA-JATO PRO"],
      ["Período:", `${new Date(filteredData.start).toLocaleDateString()} a ${new Date(filteredData.end).toLocaleDateString()}`],
      [""],
      ["Métrica", "Valor"],
      ["Total Lavagens", summary.countFat],
      ["Ticket Médio", summary.avgTicket.toFixed(2)],
      ["Entradas (R$)", summary.totalFat.toFixed(2)],
      ["Saídas (R$)", summary.totalDesp.toFixed(2)],
      ["LUCRO LÍQUIDO", summary.lucro.toFixed(2)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoData), "Resumo");
    XLSX.writeFile(wb, `Relatorio_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Barra de Filtros - Centro de Controle */}
      <div className="no-print">
        <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="bg-blue-600 p-3.5 rounded-2xl text-white shadow-xl shadow-blue-500/30">
              <BarChart3 size={24} />
            </div>
            <div className="flex flex-col">
               <span className="text-white font-black uppercase text-[10px] tracking-widest mb-1 italic">Parâmetros de Análise</span>
               <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/5">
                <input 
                  type="date" 
                  className="bg-transparent border-none p-1 text-[11px] font-black uppercase text-blue-400 focus:ring-0 w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <ArrowRight size={12} className="text-white/20" />
                <input 
                  type="date" 
                  className="bg-transparent border-none p-1 text-[11px] font-black uppercase text-blue-400 focus:ring-0 w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleExportExcel}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <FileSpreadsheet size={18} strokeWidth={2.5} /> Exportar Excel
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all"
            >
              <Printer size={18} strokeWidth={2.5} /> Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Documento Master de Performance */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 print:shadow-none print:border-none">
        
        {/* Banner de Identidade */}
        <div className="p-10 md:p-14 bg-gradient-to-br from-slate-900 to-slate-800 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] rotate-3">
              <Gauge size={40} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Lava-jato Pro</h1>
              <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em]">Executive Performance Summary</p>
            </div>
          </div>

          <div className="relative z-10 bg-white/5 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] block mb-2">Janela de Observação</span>
            <div className="text-lg font-black text-white italic uppercase tracking-tighter">
              {new Date(filteredData.start).toLocaleDateString()} <span className="mx-2 opacity-30">/</span> {new Date(filteredData.end).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Grade de KPIs Profissionais */}
        <div className="p-8 md:p-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* KPI: Atendimentos */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <ClipboardList size={20} />
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Ativo</div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Total de Lavagens</span>
                <div className="text-4xl font-black text-slate-900 tracking-tighter">{summary.countFat}</div>
              </div>
              <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase leading-relaxed italic">Volume total de veículos processados no período.</p>
            </div>

            {/* KPI: Ticket Médio */}
            <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                  <Target size={20} />
                </div>
                <div className="text-[9px] font-black text-purple-400 uppercase">Média</div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Ticket Médio</span>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">
                  R$ <span className="font-mono">{summary.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase leading-relaxed italic">Valor médio gerado por atendimento.</p>
            </div>

            {/* KPI: Entradas */}
            <div className="bg-emerald-50/50 p-7 rounded-[2rem] border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] block">Total Bruto</span>
                <div className="text-3xl font-black text-emerald-700 tracking-tighter">
                  R$ <span className="font-mono">{summary.totalFat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <p className="mt-4 text-[9px] font-bold text-emerald-400 uppercase leading-relaxed italic">Soma de todos os recebimentos no período.</p>
            </div>

            {/* KPI: Saídas */}
            <div className="bg-red-50/50 p-7 rounded-[2rem] border border-red-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em] block">Custos Totais</span>
                <div className="text-3xl font-black text-red-700 tracking-tighter">
                  R$ <span className="font-mono">{summary.totalDesp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <p className="mt-4 text-[9px] font-bold text-red-400 uppercase leading-relaxed italic">Total de gastos e despesas operacionais.</p>
            </div>
          </div>

          {/* Seção Lucro Master - Estilo Certificado de Sucesso */}
          <div className="mb-16 bg-slate-950 p-10 md:p-14 rounded-[3rem] text-center relative overflow-hidden shadow-3xl shadow-blue-900/20 group">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600" />
             
             <div className="relative z-10">
               <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full mb-6">
                 <Activity size={14} className="text-blue-500" />
                 <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.4em]">Resultado Líquido Operacional</span>
               </div>
               
               <div className={`text-6xl md:text-8xl font-black tracking-tighter italic mb-4 ${summary.lucro >= 0 ? 'text-white' : 'text-red-500'}`}>
                  R$ <span className="font-mono tabular-nums">{summary.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>

               <div className="flex items-center justify-center gap-6 mt-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Margem</span>
                    <span className="text-xs font-black text-emerald-500">{(summary.totalFat > 0 ? (summary.lucro / summary.totalFat) * 100 : 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Status</span>
                    <span className={`text-xs font-black uppercase italic ${summary.lucro > 0 ? 'text-blue-400' : 'text-red-500'}`}>
                      {summary.lucro > 0 ? 'Excedente' : 'Déficit'}
                    </span>
                  </div>
               </div>
             </div>
          </div>

          {/* Tabelas de Auditoria - Layout Ledger */}
          <div className="space-y-16">
            {/* Entradas Detail */}
            <section>
              <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-900">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Cronologia de Faturamento</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredData.fat.length} Registros</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço & Porte</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.fat.map(f => (
                      <tr key={f.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5">
                          <span className="text-xs font-black text-slate-900">{new Date(f.data).toLocaleDateString('pt-BR')}</span>
                          <span className="block text-[10px] text-slate-400 font-bold">{f.data.substring(11, 16)}h</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-black text-slate-800 uppercase italic mb-1 group-hover:text-blue-600 transition-colors">{f.tipoLavagem}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 px-1.5 rounded">{f.porte}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.pagamento}</td>
                        <td className="px-6 py-5 text-right font-black text-slate-900 text-base tracking-tighter font-mono">
                          R$ {f.valor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Saídas Detail */}
            <section>
              <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-red-600">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                    <TrendingDown size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Detalhamento de Gastos</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredData.desp.length} Saídas</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Gasto</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Justificativa / Descrição</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Dedução</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.desp.map(d => (
                      <tr key={d.id} className="group hover:bg-red-50/30 transition-colors">
                        <td className="px-6 py-5 text-xs font-black text-slate-900">{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-5">
                           <div className="text-xs font-bold text-slate-600 italic uppercase truncate max-w-[250px]">
                              {d.observacao || 'Custos Operacionais Indiretos'}
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-red-600 text-base tracking-tighter font-mono">
                          - R$ {d.valor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Rodapé Executivo */}
          <div className="mt-20 pt-10 border-t-2 border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <Gauge size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento Gerado via</p>
                <p className="text-sm font-black text-slate-900 uppercase italic">Lava-jato Pro Edition</p>
              </div>
            </div>
            <div className="text-center md:text-right border-l-4 md:border-l-0 md:border-r-4 border-slate-900 pl-4 md:pl-0 md:pr-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Autenticação de Dados</p>
              <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">
                {new Date().toLocaleDateString('pt-BR')} <span className="mx-1">•</span> {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
