
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, DollarSign, Tag, FileText } from 'lucide-react';
import { ServiceItem } from '../types';

interface ServicesManagerProps {
  services: ServiceItem[];
  onUpdate: (services: ServiceItem[]) => void;
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({ services, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(''); // Pequeno
  const [priceMedium, setPriceMedium] = useState(''); // Médio
  const [priceLarge, setPriceLarge] = useState(''); // Grande
  const [oldPrice, setOldPrice] = useState('');

  const resetForm = () => {
    setLabel('');
    setDesc('');
    setPrice('');
    setPriceMedium('');
    setPriceLarge('');
    setOldPrice('');
    setEditingId(null);
  };

  const handleSave = () => {
    if (!label || !price) {
      alert("Nome e Preço (Pequeno) são obrigatórios");
      return;
    }

    const numPrice = parseFloat(price);
    const numPriceMedium = priceMedium ? parseFloat(priceMedium) : numPrice;
    const numPriceLarge = priceLarge ? parseFloat(priceLarge) : numPriceMedium;
    const numOldPrice = oldPrice ? parseFloat(oldPrice) : undefined;
    
    if (editingId) {
      const updated = services.map(s => 
        s.id === editingId ? { ...s, label, description: desc, price: numPrice, priceMedium: numPriceMedium, priceLarge: numPriceLarge, oldPrice: numOldPrice } : s
      );
      onUpdate(updated);
    } else {
      const newItem: ServiceItem = {
        id: Math.random().toString(36).substr(2, 9),
        label,
        description: desc,
        price: numPrice,
        priceMedium: numPriceMedium,
        priceLarge: numPriceLarge,
        oldPrice: numOldPrice
      };
      onUpdate([...services, newItem]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (item: ServiceItem) => {
    setEditingId(item.id);
    setLabel(item.label);
    setDesc(item.description);
    setPrice(item.price.toString());
    setPriceMedium(item.priceMedium ? item.priceMedium.toString() : item.price.toString());
    setPriceLarge(item.priceLarge ? item.priceLarge.toString() : item.price.toString());
    setOldPrice(item.oldPrice ? item.oldPrice.toString() : '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      const updated = services.filter(s => s.id !== id);
      onUpdate(updated);
    }
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Tabela de Preços</h2>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-lg flex items-center gap-2"
        >
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-black text-slate-900 uppercase italic">{item.label}</h3>
                 <div className="flex flex-col items-end gap-1">
                   <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                     P: R$ {item.price.toFixed(2)}
                   </span>
                   {(item.priceMedium && item.priceMedium !== item.price) && (
                     <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                       M: R$ {item.priceMedium.toFixed(2)}
                     </span>
                   )}
                   {(item.priceLarge && item.priceLarge !== item.price) && (
                     <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                       G: R$ {item.priceLarge.toFixed(2)}
                     </span>
                   )}
                 </div>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">{item.description}</p>
            </div>
            
            <div className="flex gap-2 border-t pt-4 mt-auto">
              <button 
                onClick={() => handleEdit(item)}
                className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg font-bold text-[10px] uppercase hover:bg-slate-100 flex items-center justify-center gap-1"
              >
                <Edit2 size={12} /> Editar
              </button>
              <button 
                onClick={() => handleDelete(item.id)}
                className="py-2 px-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 uppercase italic">
                {editingId ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full bg-slate-100 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome do Serviço</label>
                <div className="relative">
                   <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Lavagem VIP"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                   />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço (Pequeno)</label>
                  <div className="relative">
                     <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                      type="number"
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço (Médio)</label>
                  <div className="relative">
                     <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                      type="number"
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      value={priceMedium}
                      onChange={e => setPriceMedium(e.target.value)}
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço (Grande)</label>
                  <div className="relative">
                     <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                      type="number"
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      value={priceLarge}
                      onChange={e => setPriceLarge(e.target.value)}
                     />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Antigo (Opcional - Risco)</label>
                <div className="relative">
                   <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                    type="number"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm text-slate-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    value={oldPrice}
                    onChange={e => setOldPrice(e.target.value)}
                   />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição</label>
                <div className="relative">
                   <FileText size={14} className="absolute left-3 top-3 text-slate-400" />
                   <textarea 
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border-none rounded-xl font-medium text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Detalhes do que inclui..."
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                   />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg mt-2"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
