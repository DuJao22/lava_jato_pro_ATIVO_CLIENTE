
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Car, CheckCircle2, User as UserIcon, Phone, ArrowLeft, Loader2, Star, Gift, LogOut, Clock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Agendamento, User, ServiceItem, Vehicle, CarSize } from '../types';
import { storage } from '../services/storage';

interface ClientAreaProps {
  currentUser: User;
  onSaveAgendamento: (agendamento: Agendamento) => Promise<void>;
  onLogout: () => void;
  existingAppointments: Agendamento[];
}

export const ClientArea: React.FC<ClientAreaProps> = ({ currentUser, onSaveAgendamento, onLogout, existingAppointments }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Data State
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [points, setPoints] = useState(currentUser.points);

  useEffect(() => {
    storage.getUser(currentUser.id).then(u => {
      if(u) setPoints(u.points);
    });
    storage.getServices().then(s => setServices(s));
    storage.getUserVehicles(currentUser.id).then(v => setVehicles(v));
  }, [currentUser]);

  // Form Data
  const [servicoId, setServicoId] = useState('');
  
  // Lógica de Datas (Próximos 14 dias)
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        dateObj: d,
        iso: d.toISOString().split('T')[0],
        day: d.getDate(),
        weekDay: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        fullLabel: d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      });
    }
    return dates;
  }, []);

  // Lógica de Horários 24h (00:00 até 23:00)
  // Cada serviço dura 1 hora, então não precisa de :30.
  const timeSlots = useMemo(() => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      times.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return times;
  }, []);

  const [data, setData] = useState(availableDates[0].iso);
  const [hora, setHora] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  // New Vehicle Form State
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newSize, setNewSize] = useState<CarSize>(CarSize.MEDIUM);

  // Verificação de Disponibilidade
  const isTimeSlotBusy = (dateIso: string, time: string) => {
    const checkDateTime = `${dateIso}T${time}`; // ex: 2024-02-18T17:00
    
    // Procura se existe algum agendamento ativo (pendente ou confirmado)
    // que comece exatamente nesse horário. Como dura 1h, ele ocupa o slot inteiro.
    return existingAppointments.some(ag => 
      ag.status !== 'cancelado' && 
      ag.dataAgendamento.startsWith(checkDateTime)
    );
  };

  const handleAddVehicle = async () => {
    if (!newBrand || !newModel || !newColor || !newYear) {
      alert("Marca, Modelo, Ano e Cor são obrigatórios!");
      return;
    }

    const newVehicle: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      brand: newBrand,
      model: newModel,
      color: newColor,
      plate: newPlate,
      year: newYear,
      size: newSize
    };

    await storage.addVehicle(newVehicle);
    const updated = await storage.getUserVehicles(currentUser.id);
    setVehicles(updated);
    setSelectedVehicleId(newVehicle.id);
    setShowVehicleForm(false);
    
    // Reset form
    setNewBrand(''); setNewModel(''); setNewColor(''); setNewPlate(''); setNewYear('');
  };

  const handleDeleteVehicle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Remover este veículo?')) {
        await storage.deleteVehicle(id);
        const updated = await storage.getUserVehicles(currentUser.id);
        setVehicles(updated);
        if(selectedVehicleId === id) setSelectedVehicleId('');
    }
  };

  const handleSubmit = async () => {
    if (!servicoId || !data || !hora || !selectedVehicleId) {
      alert("Preencha todos os campos e selecione um veículo.");
      return;
    }

    // Validação extra de segurança antes de enviar
    if (isTimeSlotBusy(data, hora)) {
      alert("Ops! Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.");
      return;
    }

    setIsSubmitting(true);
    const selectedService = services.find(s => s.id === servicoId);
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    
    const veiculoDesc = selectedVehicle 
      ? `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.color} (${selectedVehicle.plate || 'S/ Placa'})` 
      : 'Veículo Removido';

    const agendamento: Agendamento = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      clienteNome: currentUser.name,
      clienteTelefone: currentUser.phone,
      servico: selectedService?.label || servicoId,
      valor: selectedService?.price || 0,
      dataAgendamento: `${data}T${hora}:00`,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
      veiculoSnapshot: veiculoDesc
    };

    try {
      await onSaveAgendamento(agendamento);
      setSuccess(true);
      
      const estabelecimentoPhone = "5531995281707";
      const msg = `Ola! Agendei uma ${agendamento.servico} para meu ${selectedVehicle?.model} (${selectedVehicle?.plate || 'S/ Placa'}) no dia ${new Date(data).toLocaleDateString()} às ${hora}.`;
      const link = `https://wa.me/${estabelecimentoPhone}?text=${encodeURIComponent(msg)}`;
      
      setTimeout(() => {
        window.open(link, '_blank');
      }, 1500);

    } catch (error) {
      alert("Erro ao agendar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Agendado!</h2>
          <p className="text-slate-500 mb-8">Sua solicitação foi enviada. Confirme no WhatsApp se necessário.</p>
          <button onClick={() => { setSuccess(false); setStep(1); }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">
            Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-slate-900 pt-[var(--safe-top)] px-6 pb-20 sticky top-0 z-40 shadow-xl rounded-b-[2.5rem]">
        <div className="flex items-center justify-between py-6">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                <UserIcon size={20} />
             </div>
             <div>
               <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Olá,</p>
               <h1 className="text-lg font-black text-white uppercase italic tracking-tighter">{currentUser.name}</h1>
             </div>
           </div>
           <button onClick={onLogout} className="bg-white/10 p-2 rounded-xl text-white hover:bg-white/20">
             <LogOut size={18} />
           </button>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-2xl border border-white/10 text-white relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
           <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-2">
                 <Star fill="white" className="text-yellow-400" size={20} />
                 <span className="font-black italic uppercase tracking-widest text-xs">Fidelidade Pro</span>
              </div>
              <div className="text-right">
                <span className="block text-[8px] uppercase tracking-widest opacity-80">Saldo de Pontos</span>
                <span className="text-3xl font-black tracking-tighter">{points}</span>
              </div>
           </div>
           <div className="relative z-10">
              <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-2">
                 <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${Math.min(points, 100)}%` }} />
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wide opacity-80">
                 <span>{points}/100 para resgatar</span>
                 <span>Próximo Nível <Gift size={10} className="inline mb-0.5 ml-1" /></span>
              </div>
           </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-6 -mt-12 relative z-50">
        <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              
              {/* SERVIÇOS */}
              <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Car size={16} /> Escolha o Serviço
                </h2>
                <div className="grid gap-3">
                  {services.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum serviço disponível.</p>
                  ) : (
                    services.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setServicoId(s.id)}
                        className={`p-5 rounded-2xl text-left border-2 transition-all ${
                          servicoId === s.id 
                            ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-500/10' 
                            : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-black uppercase italic ${servicoId === s.id ? 'text-blue-700' : 'text-slate-800'}`}>{s.label}</span>
                          {servicoId === s.id && <CheckCircle2 size={18} className="text-blue-600" />}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium">{s.description}</span>
                          <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase">
                            R$ {s.price.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* SELETOR DE DATAS HORIZONTAL */}
              <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar size={16} /> Selecione o Dia
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                  {availableDates.map((d) => {
                     const isSelected = data === d.iso;
                     return (
                       <button
                         key={d.iso}
                         onClick={() => { setData(d.iso); setHora(''); }}
                         className={`flex flex-col items-center justify-center min-w-[70px] py-4 rounded-2xl border-2 transition-all ${
                           isSelected
                             ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                             : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                         }`}
                       >
                         <span className="text-[10px] font-black uppercase tracking-widest mb-1">{d.weekDay}</span>
                         <span className={`text-xl font-black tracking-tighter ${isSelected ? 'text-white' : 'text-slate-800'}`}>{d.day}</span>
                       </button>
                     );
                  })}
                </div>
              </div>

              {/* SELETOR DE HORÁRIO EM GRADE - 24H */}
              <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Clock size={16} /> Horário (24h)</span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded">Duração: 1h</span>
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((t) => {
                    const isSelected = hora === t;
                    const isBusy = isTimeSlotBusy(data, t);
                    
                    return (
                      <button
                        key={t}
                        disabled={isBusy}
                        onClick={() => setHora(t)}
                        className={`py-3 rounded-xl text-xs font-black transition-all border relative ${
                          isBusy 
                             ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60'
                             : isSelected 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {t}
                        {isBusy && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-[1px] w-[80%] bg-slate-300 rotate-45 absolute" />
                              <div className="h-[1px] w-[80%] bg-slate-300 -rotate-45 absolute" />
                           </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-4 justify-center">
                   <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-white border border-slate-200" />
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Livre</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-blue-600" />
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Selecionado</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200 relative overflow-hidden">
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-[1px] w-full bg-slate-300 rotate-45" />
                         </div>
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold">Ocupado</span>
                   </div>
                </div>
              </div>

              <button 
                disabled={!servicoId || !data || !hora}
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 transition-all active:scale-95"
              >
                Continuar
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
               <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-4 hover:text-blue-600">
                  <ArrowLeft size={14} /> Voltar
               </button>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Resumo Parcial</h3>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-black text-slate-900 italic uppercase">
                      {services.find(s => s.id === servicoId)?.label}
                    </p>
                    <p className="text-sm font-medium text-slate-600 mt-1 capitalize">
                      {availableDates.find(d => d.iso === data)?.fullLabel} às {hora}
                    </p>
                  </div>
                  <div className="text-right">
                     <span className="block text-[8px] uppercase tracking-widest text-slate-400">Valor</span>
                     <span className="text-xl font-black text-blue-600 tracking-tighter">
                        R$ {services.find(s => s.id === servicoId)?.price.toFixed(2)}
                     </span>
                  </div>
                </div>
              </div>

              {/* SELEÇÃO DE VEÍCULO */}
              <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                   <span className="flex items-center gap-2"><Car size={16} /> Qual veículo será lavado?</span>
                   <button 
                    onClick={() => setShowVehicleForm(!showVehicleForm)}
                    className="text-[9px] bg-blue-100 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-200 transition-colors"
                   >
                     {showVehicleForm ? 'Cancelar' : '+ Cadastrar Novo'}
                   </button>
                </h2>

                {showVehicleForm ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-blue-200 space-y-3 animate-in fade-in zoom-in duration-200">
                     <div className="grid grid-cols-2 gap-3">
                        <input 
                           placeholder="Marca (Ex: Honda)" 
                           className="w-full p-3 bg-white border-none rounded-xl text-xs font-bold"
                           value={newBrand} onChange={e => setNewBrand(e.target.value)}
                        />
                        <input 
                           placeholder="Modelo (Ex: Civic)" 
                           className="w-full p-3 bg-white border-none rounded-xl text-xs font-bold"
                           value={newModel} onChange={e => setNewModel(e.target.value)}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <input 
                           placeholder="Cor (Ex: Preto)" 
                           className="w-full p-3 bg-white border-none rounded-xl text-xs font-bold"
                           value={newColor} onChange={e => setNewColor(e.target.value)}
                        />
                        <input 
                           placeholder="Ano (Ex: 2020)" 
                           type="number"
                           className="w-full p-3 bg-white border-none rounded-xl text-xs font-bold"
                           value={newYear} onChange={e => setNewYear(e.target.value)}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <input 
                           placeholder="Placa (Opcional)" 
                           className="w-full p-3 bg-white border-none rounded-xl text-xs font-bold"
                           value={newPlate} onChange={e => setNewPlate(e.target.value)}
                        />
                         <select 
                           className="w-full p-3 bg-white border-none rounded-xl text-xs font-bold"
                           value={newSize} onChange={e => setNewSize(e.target.value as CarSize)}
                        >
                           <option value={CarSize.SMALL}>Pequeno</option>
                           <option value={CarSize.MEDIUM}>Médio</option>
                           <option value={CarSize.LARGE}>Grande</option>
                        </select>
                     </div>
                     <button 
                        onClick={handleAddVehicle}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                     >
                        Salvar Veículo
                     </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicles.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                         <p className="text-xs text-slate-400 italic mb-2">Nenhum veículo cadastrado</p>
                         <button onClick={() => setShowVehicleForm(true)} className="text-xs font-black text-blue-600 underline">Cadastrar Agora</button>
                      </div>
                    ) : (
                      vehicles.map(v => (
                        <div 
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                             selectedVehicleId === v.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                           <div>
                              <h4 className="font-black text-slate-900 uppercase italic text-sm">{v.brand} {v.model}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{v.color} • {v.plate || 'S/ Placa'}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              {selectedVehicleId === v.id && <CheckCircle2 size={18} className="text-blue-600" />}
                              <button onClick={(e) => handleDeleteVehicle(e, v.id)} className="text-slate-300 hover:text-red-500">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedVehicleId}
                className="w-full bg-emerald-600 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl mt-4 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
