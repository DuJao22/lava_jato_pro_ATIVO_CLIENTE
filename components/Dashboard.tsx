
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCcw,
  Calendar,
  ArrowRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';
import { Faturamento, Despesa } from '../types';

interface DashboardProps {
  faturamentos: Faturamento[];
  despesas: Despesa[];
}

type Period = 'today' | '7days' | 'month' | 'custom';

export const Dashboard: React.FC<DashboardProps> = ({ faturamentos, despesas }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [faturamentos, despesas, period, customStart, customEnd]);

  const filteredData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let startLimit = '1900-01-01';
    let endLimit = '2100-12-31';

    if (period === 'today') {
      startLimit = today;
      endLimit = today;
    } else if (period === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startLimit = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      const d = new Date();
      startLimit = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01';
    } else if (period === 'custom') {
      startLimit = customStart;
      endLimit = customEnd;
    }

    const fat = faturamentos.filter(f => {
      const itemDate = f.data.substring(0, 10);
      return itemDate >= startLimit && itemDate <= endLimit;
    });
    
    const desp = despesas.filter(d => {
      const itemDate = d.data.substring(0, 10);
      return itemDate >= startLimit && itemDate <= endLimit;
    });

    return { fat, desp, startLimit, endLimit };
  }, [faturamentos, despesas, period, customStart, customEnd]);

  const stats = useMemo(() => {
    const totalFat = filteredData.fat.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const totalDesp = filteredData.desp.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    return {
      totalFaturamento: totalFat,
      totalDespesas: totalDesp,
      lucro: totalFat - totalDesp,
      atendimentos: filteredData.fat.length,
      ticketMedio: filteredData.fat.length > 0 ? totalFat / filteredData.fat.length : 0
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const dailyMap: Record<string, { date: string; faturamento: number; despesas: number; rawDate: string }> = {};
    const today = new Date();
    
    // Define os últimos 7 dias fixos para o gráfico de tendência
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      dailyMap[dStr] = { 
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
        faturamento: 0, 
        despesas: 0,
        rawDate: dStr
      };
    }

    faturamentos.forEach(f => {
      const dStr = f.data.substring(0, 10);
      if (dailyMap[dStr]) dailyMap[dStr].faturamento += (Number(f.valor) || 0);
    });

    despesas.forEach(d => {
      const dStr = d.data.substring(0, 10);
      if (dailyMap[dStr]) dailyMap[dStr].despesas += (Number(d.valor) || 0);
    });

    return Object.values(dailyMap)
      .map(item => ({
        ...item,
        lucro: item.faturamento - item.despesas
      }))
      .sort((a,b) => a.rawDate.localeCompare(b.rawDate));
  }, [faturamentos, despesas]);

  return (
    <div className={`space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
      
      {/* Filtro Híbrido Profissional */}
      <div className="space-y-3">
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 w-full shadow-2xl backdrop-blur-xl">
          {[
            { id: 'today', label: 'Hoje' },
            { id: '7days', label: '7 Dias' },
            { id: 'month', label: 'Mês' },
            { id: 'custom', label: 'Intervalo' }
          ].map((p) => (
            <button 
              key={p.id}
              onClick={() => setPeriod(p.id as Period)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'text-slate-400 hover:text-white'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="glass p-4 rounded-2xl border-white/20 animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3">
            <div className="flex-1 bg-white/50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <Calendar size={12} className="text-blue-500" />
              <input 
                type="date" 
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase text-slate-700 focus:ring-0 w-full"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <ArrowRight size={14} className="text-slate-400" />
            <div className="flex-1 bg-white/50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <Calendar size={12} className="text-blue-500" />
              <input 
                type="date" 
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase text-slate-700 focus:ring-0 w-full"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cards de Métricas Principais - Grade 2x2 Mobile */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
          <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Atendimentos
          </span>
          <div className="text-3xl font-black text-slate-900 tracking-tighter">
            {stats.atendimentos}
          </div>
          <div className="text-[8px] font-bold text-slate-400 uppercase mt-2">Volume Total</div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
          <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <DollarSign size={10} className="text-emerald-500" /> Ticket Médio
          </span>
          <div className="text-2xl font-black text-slate-900 tracking-tighter">
            R$ {stats.ticketMedio.toFixed(0)}
          </div>
          <div className="text-[8px] font-bold text-emerald-500 uppercase mt-2">Média por Carro</div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
          <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <TrendingUp size={10} className="text-blue-600" /> Entradas
          </span>
          <div className="text-2xl font-black text-blue-600 tracking-tighter">
            R$ {stats.totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[8px] font-bold text-slate-400 uppercase mt-2">Bruto no Período</div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[120px]">
          <span className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <TrendingDown size={10} className="text-red-500" /> Saídas
          </span>
          <div className="text-2xl font-black text-red-600 tracking-tighter">
            R$ {stats.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[8px] font-bold text-slate-400 uppercase mt-2">Custos Operacionais</div>
        </div>
      </div>

      {/* Card Lucro Destaque - Hero Section */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-600/30 transition-colors" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-3xl -ml-8 -mb-8" />
        
        <div className="relative z-10 text-center">
          <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.5em] mb-3 block">Lucro Líquido Real</span>
          <div className={`text-5xl font-black tracking-tighter italic ${stats.lucro >= 0 ? 'text-white' : 'text-red-400'}`}>
            R$ {stats.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-6 inline-flex items-center gap-3 bg-white/5 px-6 py-2.5 rounded-full border border-white/10 backdrop-blur-sm">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
             <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Performance Validada</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução com 3 Marcações */}
      <div className="glass p-6 rounded-[2.5rem] border-white/10 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest flex items-center gap-2">
             <BarChart3 size={14} className="text-blue-600" /> Tendência de Caixa (7D)
           </h3>
           <div className="bg-slate-100 p-2 rounded-xl">
             <RefreshCcw size={12} className={`text-slate-400 ${isAnimating ? 'animate-spin' : ''}`} />
           </div>
        </div>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} 
                dy={10} 
              />
              <YAxis axisLine={false} tickLine={false} hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '24px', 
                  border: 'none', 
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
                  padding: '16px',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)'
                }}
                labelStyle={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 0' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
              />
              
              {/* Saídas (Vermelho - Tracejado) */}
              <Area 
                type="monotone" 
                dataKey="despesas" 
                name="Saídas" 
                stroke="#dc2626" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                fill="url(#colorDesp)" 
                animationDuration={1500}
              />
              
              {/* Entradas (Azul - Sólido) */}
              <Area 
                type="monotone" 
                dataKey="faturamento" 
                name="Entradas" 
                stroke="#2563eb" 
                strokeWidth={3} 
                fill="url(#colorFat)" 
                animationDuration={1500}
              />

              {/* Lucro Líquido (Verde - Destaque) */}
              <Area 
                type="monotone" 
                dataKey="lucro" 
                name="Lucro Real" 
                stroke="#059669" 
                strokeWidth={4} 
                fill="url(#colorLucro)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legenda Customizada */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-600 rounded-full" />
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-red-600 rounded-full border-t border-dashed" />
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Saídas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Lucro Real</span>
          </div>
        </div>
      </div>
    </div>
  );
};
