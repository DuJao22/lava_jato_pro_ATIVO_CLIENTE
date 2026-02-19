
import React, { useState, useEffect } from 'react';
import { Save, MapPin, Phone, Instagram, Image, Navigation, Loader2 } from 'lucide-react';
import { EstablishmentInfo } from '../types';
import { storage } from '../services/storage';

export const SettingsManager: React.FC = () => {
  const [info, setInfo] = useState<EstablishmentInfo>({
    name: '',
    address: '',
    phone: '',
    instagram: '',
    logoUrl: '',
    wazeUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    setLoading(true);
    const data = await storage.getEstablishmentInfo();
    setInfo(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await storage.saveEstablishmentInfo(info);
    if (success) {
      alert('Informações salvas com sucesso!');
      await loadInfo(); // Recarrega para confirmar
    } else {
      alert('Erro ao salvar na nuvem. As informações foram salvas localmente.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
          Configurações do Estabelecimento
        </h2>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
        
        {/* Nome e Logo */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Lava Jato</label>
            <input 
              value={info.name}
              onChange={e => setInfo({...info, name: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Lava Jato Pro"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Image size={14} /> URL da Logo
            </label>
            <input 
              value={info.logoUrl || ''}
              onChange={e => setInfo({...info, logoUrl: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Contato */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Phone size={14} /> Telefone / WhatsApp
            </label>
            <input 
              value={info.phone}
              onChange={e => setInfo({...info, phone: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-500"
              placeholder="5531999999999"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Instagram size={14} /> Instagram
            </label>
            <input 
              value={info.instagram}
              onChange={e => setInfo({...info, instagram: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-500"
              placeholder="@seu.lavajato"
            />
          </div>
        </div>

        {/* Endereço e Waze */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <MapPin size={14} /> Endereço Completo
            </label>
            <input 
              value={info.address}
              onChange={e => setInfo({...info, address: e.target.value})}
              className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rua, Número, Bairro, Cidade"
            />
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Navigation size={14} /> Link do Waze (Deep Link)
            </label>
            <div className="flex gap-2">
              <input 
                value={info.wazeUrl || ''}
                onChange={e => setInfo({...info, wazeUrl: e.target.value})}
                className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-500 text-xs"
                placeholder="https://waze.com/ul/..."
              />
              <a 
                href="https://developers.google.com/maps/documentation/urls/get-started" 
                target="_blank" 
                rel="noreferrer"
                className="p-4 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                title="Ajuda"
              >
                ?
              </a>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Dica: Use o link de compartilhamento do Waze ou Google Maps.
            </p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
        >
          {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}
        </button>

      </div>
    </div>
  );
};
