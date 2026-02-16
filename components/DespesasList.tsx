
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, Receipt, MessageSquare, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { Despesa } from '../types';

interface DespesasListProps {
  items: Despesa[];
  onUpdate: (items: Despesa[]) => void;
}

export const DespesasList: React.FC<DespesasListProps> = ({ items, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form states
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemDate = item.data.split('T')[0];
      
      let matchDate = true;
      if (startDate && endDate) {
        matchDate = itemDate >= startDate && itemDate <= endDate;
      } else if (startDate) {
        matchDate = itemDate >= startDate;
      } else if (endDate) {
        matchDate = itemDate <= endDate;
      }
      return matchDate;
    }).sort((a,b) => b.data.localeCompare(a.data));
  }, [items, startDate, endDate]);

  const resetForm = () => {
    setValor('');
    setObservacao('');
    setData(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  /**
   * Correção Crítica de Data:
   * Adicionamos T12:00:00 para garantir que a data não retroceda por causa do fuso horário
   * quando for interpretada pelo navegador em modo local.
   */
  const handleSave = () => {
    const vTotal = Number(valor) || 0;
    if (vTotal <= 0) {
      alert("Insira um valor válido!");
      return;
    }

    const isoData = `${data}T12:00:00.000Z`;

    if (editingId) {
      const updated = items.map(item => 
        item.id === editingId 
          ? { ...item, valor: vTotal, observacao, data: isoData } 
          : item
      );
      onUpdate(updated);
    } else {
      const newItem: Despesa = {
        id: Math.random().toString(36).substr(2, 9),
        valor: vTotal,
        observacao,
        data: isoData
      };
      onUpdate([...items, newItem]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (item: Despesa) => {
    setEditingId(item.id);
    setValor(item.valor.toString());
    setObservacao(item.observacao);
    setData(item.data.split('T')[0]);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir esta despesa?')) {
      onUpdate(items.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-4 pb-20 px-2 md:px-0">
      <button
        onClick={() => { resetForm(); setIsModalOpen(true); }}
        className="md:hidden fixed bottom-24 right-4 z-40 bg-red-600 text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform border-4 border-white"
      >
        <Plus size={28} />
      </button>

      <div className="flex flex-col gap-3 glass p-3 md:p-4 rounded-2xl border-white/20">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full">
           <div className="flex flex-1 items-center gap-1.5 bg-white/50 p-2 rounded-xl border border-white shrink-0">
              <Calendar size={12} className="text-red-500" />
              <input 
                type="date" 
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase text-slate-800 focus:ring-0 w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <ArrowRight size={10} className="text-slate-300" />
              <input 
                type="date" 
                className="bg-transparent border-none p-0 text-[10px] font-black uppercase text-slate-800 focus:ring-0 w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
           </div>
           <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="hidden md:flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg"
          >
            <Plus size={16} /> Novo Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map(item => (
          <div key={item.id} onClick={() => handleEdit(item)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 active:bg-slate-50 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-black uppercase block">Valor</span>
                <span className="text-xl font-black text-slate-900 tracking-tighter">
                  R$ {Number(item.valor).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-50 space-y-1">
               <p className="text-[10px] font-bold text-slate-600 italic line-clamp-1 uppercase">
                  {item.observacao || "Gasto Operacional"}
               </p>
               <div className="flex items-center gap-1.5 text-slate-400">
                 <Calendar size={10} />
                 <p className="text-[9px] font-black uppercase tracking-widest">
                   {new Date(item.data).toLocaleDateString('pt-BR')}
                 </p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[1.5rem] md:rounded-[2rem] shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-white rounded-t-[1.5rem]">
              <h3 className="font-black text-slate-900 italic uppercase tracking-tighter text-base">
                {editingId ? 'Editar Gasto' : 'Novo Lançamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor (R$)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <DollarSign size={18} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl font-black text-2xl tracking-tighter"
                    placeholder="0,00"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observação</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm min-h-[80px] italic"
                  placeholder="Ex: Aluguel, Sabão, Luz..."
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data</label>
                <input
                  type="date"
                  className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-xl font-black text-xs uppercase"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </div>

              {editingId && (
                <button onClick={() => handleDelete(editingId)} className="w-full py-2 text-red-500 font-black uppercase text-[9px] flex items-center justify-center gap-2">
                  <Trash2 size={12} /> Excluir permanentemente
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex gap-3 sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-black uppercase text-[10px] text-slate-500">Cancelar</button>
              <button onClick={handleSave} className="flex-[2] py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95">Salvar Gasto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
