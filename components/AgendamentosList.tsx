
import React from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, User, Phone, DollarSign, Car, Info } from 'lucide-react';
import { Agendamento, ServiceItem } from '../types';

interface AgendamentosListProps {
  agendamentos: Agendamento[];
  onUpdate: (items: Agendamento[]) => void;
  services: ServiceItem[];
}

export const AgendamentosList: React.FC<AgendamentosListProps> = ({ agendamentos, onUpdate, services }) => {
  
  const handleStatusChange = (id: string, newStatus: 'confirmado' | 'cancelado' | 'concluido') => {
    const updated = agendamentos.map(a => a.id === id ? { ...a, status: newStatus } : a);
    onUpdate(updated);
  };

  const pending = agendamentos.filter(a => a.status === 'pendente');
  const confirmed = agendamentos.filter(a => a.status === 'confirmado');
  const history = agendamentos.filter(a => ['concluido', 'cancelado'].includes(a.status));

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      pendente: 'bg-amber-100 text-amber-700 border-amber-200',
      confirmado: 'bg-blue-100 text-blue-700 border-blue-200',
      concluido: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cancelado: 'bg-slate-100 text-slate-500 border-slate-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wide ${(styles as any)[status]}`}>
        {status}
      </span>
    );
  };

  const Card: React.FC<{ item: Agendamento }> = ({ item }) => {
    // Busca a descrição do serviço baseado no nome salvo no agendamento
    const serviceDetails = services.find(s => s.label === item.servico);

    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-black text-slate-900 uppercase italic text-sm">{item.servico}</h4>
            
            {/* DESCRIÇÃO DO SERVIÇO */}
            {serviceDetails?.description && (
              <div className="flex items-start gap-1 mt-1 mb-2">
                <Info size={10} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-500 font-medium italic leading-tight">
                  {serviceDetails.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
              <User size={12} />
              <span className="text-[10px] font-bold uppercase">{item.clienteNome}</span>
            </div>
            {/* VEÍCULO INFO */}
            {item.veiculoSnapshot && (
               <div className="flex items-center gap-1.5 mt-1 text-blue-600">
                 <Car size={12} />
                 <span className="text-[10px] font-black uppercase">{item.veiculoSnapshot}</span>
               </div>
            )}
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex items-center gap-4 py-2 border-t border-b border-slate-50">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-700">
              {new Date(item.dataAgendamento).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-700">
              {new Date(item.dataAgendamento).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 ml-auto bg-slate-50 px-2 py-0.5 rounded-md">
            <DollarSign size={10} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-900">
               R$ {item.valor.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5">
              <Phone size={12} className="text-emerald-500" />
              <a href={`https://wa.me/${item.clienteTelefone.replace(/\D/g,'')}`} target="_blank" className="text-[10px] font-black text-emerald-600 hover:underline">
                WhatsApp
              </a>
           </div>
        </div>

        {item.status === 'pendente' && (
          <div className="flex gap-2 mt-1">
            <button 
              onClick={() => handleStatusChange(item.id, 'cancelado')}
              className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-1 hover:bg-slate-200"
            >
              <XCircle size={12} /> Rejeitar
            </button>
            <button 
              onClick={() => handleStatusChange(item.id, 'confirmado')}
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-1 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              <CheckCircle2 size={12} /> Confirmar
            </button>
          </div>
        )}

        {item.status === 'confirmado' && (
          <button 
            onClick={() => handleStatusChange(item.id, 'concluido')}
            className="w-full py-2 bg-emerald-600 text-white rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-1 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 size={12} /> Concluir e Baixar
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <section>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /> Pendentes ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhum agendamento pendente.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map(item => <Card key={item.id} item={item} />)}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" /> Confirmados ({confirmed.length})
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {confirmed.map(item => <Card key={item.id} item={item} />)}
        </div>
      </section>

      <section className="opacity-60 hover:opacity-100 transition-opacity">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Histórico</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.slice(0, 5).map(item => <Card key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
};
