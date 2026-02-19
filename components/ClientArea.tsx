
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Car, CheckCircle2, User as UserIcon, LogOut, 
  Clock, Plus, Trash2, Home, History, ChevronRight, 
  Star, X, CalendarDays, MapPin, Navigation
} from 'lucide-react';
import { Agendamento, User, ServiceItem, Vehicle, CarSize, EstablishmentInfo } from '../types';
import { storage } from '../services/storage';

interface ClientAreaProps {
  currentUser: User | null;
  onSaveAgendamento: (agendamento: Agendamento) => Promise<void>;
  onLogout: () => void;
  onLoginRequest: () => void;
  existingAppointments: Agendamento[];
}

type Tab = 'home' | 'book' | 'history' | 'vehicles';

export const ClientArea: React.FC<ClientAreaProps> = ({ 
  currentUser, 
  onSaveAgendamento, 
  onLogout, 
  onLoginRequest,
  existingAppointments 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [points, setPoints] = useState(currentUser?.points || 0);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [establishment, setEstablishment] = useState<EstablishmentInfo | null>(null);
  
  // Booking State
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Vehicle Form State
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    brand: '', model: '', color: '', plate: '', year: '', size: CarSize.MEDIUM
  });

  // Load Data
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const u = await storage.getUser(currentUser.id);
        if (u) setPoints(u.points);
        
        const v = await storage.getUserVehicles(currentUser.id);
        setVehicles(v);
      } else {
        setPoints(0);
        setVehicles([]);
      }
      
      const s = await storage.getServices();
      setServices(s);

      const info = await storage.getEstablishmentInfo();
      setEstablishment(info);
    };
    loadUserData();
  }, [currentUser]);

  // Computed Data
  const myAppointments = useMemo(() => 
    currentUser 
      ? existingAppointments
          .filter(a => a.userId === currentUser.id)
          .sort((a, b) => new Date(b.dataAgendamento).getTime() - new Date(a.dataAgendamento).getTime())
      : [],
  [existingAppointments, currentUser]);

  const upcomingAppointments = useMemo(() => 
    myAppointments.filter(a => 
      new Date(a.dataAgendamento) > new Date() && 
      a.status !== 'cancelado' && 
      a.status !== 'concluido'
    ).sort((a, b) => new Date(a.dataAgendamento).getTime() - new Date(b.dataAgendamento).getTime()),
  [myAppointments]);

  // Booking Logic
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

  const timeSlots = useMemo(() => {
    const times = [];
    for (let i = 0; i < 24; i++) { // 24h availability
      times.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return times;
  }, []);

  const isTimeSlotBusy = (dateIso: string, time: string) => {
    const checkDateTime = `${dateIso}T${time}`;
    return existingAppointments.some(ag => 
      ag.status !== 'cancelado' && 
      ag.dataAgendamento.startsWith(checkDateTime)
    );
  };

  const handleBook = async () => {
    if (!selectedServiceId || !selectedDate || !selectedTime || !selectedVehicleId || !currentUser) return;
    
    setIsSubmitting(true);
    try {
      const service = services.find(s => s.id === selectedServiceId);
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      
      const agendamento: Agendamento = {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser.id,
        clienteNome: currentUser.name,
        clienteTelefone: currentUser.phone,
        servico: service?.label || '',
        valor: service?.price || 0,
        dataAgendamento: `${selectedDate}T${selectedTime}:00`,
        status: 'pendente',
        criadoEm: new Date().toISOString(),
        veiculoSnapshot: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'Veículo'
      };

      await onSaveAgendamento(agendamento);
      setSuccessModal(true);
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedServiceId('');
      setBookingStep(1);
    } catch (error) {
      alert('Erro ao agendar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.model || !currentUser) return;
    
    const v: Vehicle = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      ...newVehicle
    };
    
    await storage.addVehicle(v);
    setVehicles(await storage.getUserVehicles(currentUser.id));
    setShowVehicleForm(false);
    setNewVehicle({ brand: '', model: '', color: '', plate: '', year: '', size: CarSize.MEDIUM });
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!currentUser) return;
    if (confirm('Excluir veículo?')) {
      await storage.deleteVehicle(id);
      setVehicles(await storage.getUserVehicles(currentUser.id));
    }
  };

  // --- RENDERERS ---

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center p-2">
        <NavButton icon={<Home size={20} />} label="Início" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon={<Plus size={24} />} label="Agendar" active={activeTab === 'book'} onClick={() => setActiveTab('book')} isMain />
        <NavButton icon={<History size={20} />} label="Histórico" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavButton icon={<Car size={20} />} label="Veículos" active={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
      </div>
    </div>
  );

  const NavButton = ({ icon, label, active, onClick, isMain }: any) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${
        active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <div className={`mb-1 ${isMain ? 'bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-500/30 -mt-6 border-4 border-white' : ''}`}>
        {React.cloneElement(icon, { size: isMain ? 24 : 20 })}
      </div>
      {!isMain && <span className="text-[10px] font-bold tracking-wide">{label}</span>}
    </button>
  );

  const renderHome = () => (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {establishment?.logoUrl ? (
            <img src={establishment.logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-sm" />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
              {establishment?.name ? establishment.name.substring(0, 2).toUpperCase() : 'LJ'}
            </div>
          )}
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Bem-vindo ao</p>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{establishment?.name || 'Lava Jato Pro'}</h1>
            <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aberto 24h</span>
            </div>
          </div>
        </div>
        {currentUser ? (
          <button onClick={onLogout} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
            <LogOut size={18} />
          </button>
        ) : (
          <button onClick={onLoginRequest} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30">
            Entrar
          </button>
        )}
      </div>

      {/* Location Card */}
      {establishment && (
        <div 
          onClick={() => {
            if (establishment.wazeUrl) {
              window.open(establishment.wazeUrl, '_blank');
            } else if (establishment.address) {
              // Fallback: Search address on Waze
              const query = encodeURIComponent(establishment.address);
              window.open(`https://waze.com/ul?q=${query}&navigate=yes`, '_blank');
            }
          }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Localização</p>
              <p className="text-xs font-bold text-slate-900 truncate">{establishment.address}</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Navigation size={20} />
          </div>
        </div>
      )}

      {/* Loyalty Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 text-white shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gradient-to-br from-yellow-400 to-transparent opacity-20 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Programa Fidelidade</span>
            </div>
            {currentUser && (
              <div className="text-right">
                <span className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                  {points}
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500">Pontos Acumulados</span>
              </div>
            )}
          </div>
          
          {currentUser ? (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Nível Atual</span>
                <span>Próxima Recompensa (100)</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-1000 ease-out" 
                  style={{ width: `${Math.min(points, 100)}%` }} 
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm font-bold text-slate-300 mb-4">Faça login para acumular pontos e ganhar lavagens grátis!</p>
              <button onClick={onLoginRequest} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                Entrar ou Cadastrar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Appointment */}
      <div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Próximo Agendamento</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <CalendarDays size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{upcomingAppointments[0].servico}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {new Date(upcomingAppointments[0].dataAgendamento).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' • '}
                {new Date(upcomingAppointments[0].dataAgendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wide">
              {upcomingAppointments[0].status}
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setActiveTab('book')}
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Nenhum agendamento futuro</p>
            <p className="text-blue-600 text-sm font-black mt-1">Agendar Agora</p>
          </div>
        )}
      </div>

      {/* Quick Services */}
      <div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Nossos Serviços</h2>
        <div className="grid grid-cols-2 gap-3">
          {services.slice(0, 4).map(s => (
            <button 
              key={s.id} 
              onClick={() => {
                setSelectedServiceId(s.id);
                setBookingStep(2);
                setActiveTab('book');
              }}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left hover:border-blue-200 transition-all active:scale-95 relative overflow-hidden"
            >
              {s.oldPrice && s.oldPrice > s.price && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-bl-xl">
                  Promoção
                </div>
              )}
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 mb-3">
                <Car size={16} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{s.label}</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{s.description}</p>
              <div className="mt-2 flex items-center gap-2">
                 <p className="text-xs font-black text-blue-600">R$ {s.price.toFixed(2)}</p>
                 {s.oldPrice && s.oldPrice > s.price && (
                   <p className="text-[10px] font-bold text-slate-400 line-through">R$ {s.oldPrice.toFixed(2)}</p>
                 )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBook = () => (
    <div className="pb-24 animate-in slide-in-from-bottom duration-500">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Novo Agendamento</h1>
      
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(step => (
          <div key={step} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step <= bookingStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      {bookingStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">1. Escolha o Serviço</h2>
          {services.map(s => (
            <button
              key={s.id}
              onClick={() => { setSelectedServiceId(s.id); setBookingStep(2); }}
              className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${
                selectedServiceId === s.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'
              }`}
            >
              <div>
                <span className="block font-black text-slate-900 uppercase italic text-sm">{s.label}</span>
                <span className="text-xs text-slate-500">{s.description}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {s.oldPrice && s.oldPrice > s.price && (
                    <span className="block text-[10px] font-bold text-slate-400 line-through">R$ {s.oldPrice.toFixed(2)}</span>
                  )}
                  <span className="font-black text-slate-900">R$ {s.price.toFixed(2)}</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600" />
              </div>
            </button>
          ))}
        </div>
      )}

      {bookingStep === 2 && (
        <div className="space-y-6">
          <button onClick={() => setBookingStep(1)} className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-slate-600">
            <ChevronRight className="rotate-180" size={14} /> Voltar
          </button>
          
          <div>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">2. Data e Hora</h2>
            
            {/* Dates */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
              {availableDates.map(d => (
                <button
                  key={d.iso}
                  onClick={() => { setSelectedDate(d.iso); setSelectedTime(''); }}
                  className={`flex flex-col items-center justify-center min-w-[70px] py-4 rounded-2xl border-2 transition-all ${
                    selectedDate === d.iso
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1">{d.weekDay}</span>
                  <span className={`text-xl font-black tracking-tighter ${selectedDate === d.iso ? 'text-white' : 'text-slate-800'}`}>{d.day}</span>
                </button>
              ))}
            </div>

            {/* Times */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {timeSlots.map(t => {
                const isBusy = isTimeSlotBusy(selectedDate, t);
                return (
                  <button
                    key={t}
                    disabled={isBusy || !selectedDate}
                    onClick={() => { setSelectedTime(t); setBookingStep(3); }}
                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                      isBusy 
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed decoration-slate-300 line-through'
                        : selectedTime === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {bookingStep === 3 && (
        <div className="space-y-6">
          <button onClick={() => setBookingStep(2)} className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-slate-600">
            <ChevronRight className="rotate-180" size={14} /> Voltar
          </button>

          <div>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">3. Selecione o Veículo</h2>
            
            {!currentUser ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-xs text-slate-400 italic mb-4">Você precisa entrar para selecionar seu veículo.</p>
                <button onClick={onLoginRequest} className="text-xs font-black bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 uppercase tracking-widest">
                  Entrar ou Cadastrar
                </button>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-xs text-slate-400 italic mb-4">Nenhum veículo cadastrado</p>
                <button onClick={() => setActiveTab('vehicles')} className="text-xs font-black bg-slate-900 text-white px-4 py-2 rounded-lg">
                  Cadastrar Veículo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                      selectedVehicleId === v.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="text-left">
                      <h4 className="font-black text-slate-900 uppercase italic text-sm">{v.brand} {v.model}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{v.color} • {v.plate || 'S/ Placa'}</p>
                    </div>
                    {selectedVehicleId === v.id && <CheckCircle2 size={20} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={!selectedVehicleId || isSubmitting || !currentUser}
            onClick={handleBook}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processando...' : 'Confirmar Agendamento'}
          </button>
        </div>
      )}
    </div>
  );

  const renderHistory = () => {
    if (!currentUser) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-in fade-in">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
            <History size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Histórico de Agendamentos</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">Faça login para visualizar seus agendamentos anteriores e status.</p>
          <button onClick={onLoginRequest} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/30">
            Entrar Agora
          </button>
        </div>
      );
    }

    return (
      <div className="pb-24 animate-in fade-in duration-500">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Meus Agendamentos</h1>
        
        {myAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <History size={32} />
            </div>
            <p className="text-slate-500 font-medium">Você ainda não tem agendamentos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myAppointments.map(ag => (
              <div key={ag.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  ag.status === 'concluido' ? 'bg-emerald-500' : 
                  ag.status === 'confirmado' ? 'bg-blue-500' : 
                  ag.status === 'cancelado' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {ag.status}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(ag.dataAgendamento).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-black text-slate-900 text-lg mb-1">{ag.servico}</h3>
                <p className="text-xs text-slate-500 mb-3">{ag.veiculoSnapshot}</p>
                
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <Clock size={12} />
                  {new Date(ag.dataAgendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVehicles = () => {
    if (!currentUser) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-in fade-in">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
            <Car size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Meus Veículos</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">Faça login para gerenciar seus veículos cadastrados.</p>
          <button onClick={onLoginRequest} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/30">
            Entrar Agora
          </button>
        </div>
      );
    }

    return (
      <div className="pb-24 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meus Veículos</h1>
          <button 
            onClick={() => setShowVehicleForm(true)}
            className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-slate-900/20"
          >
            <Plus size={20} />
          </button>
        </div>

        {showVehicleForm && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Novo Veículo</h3>
              <button onClick={() => setShowVehicleForm(false)}><X size={16} className="text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input 
                placeholder="Marca" 
                className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-500/20"
                value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})}
              />
              <input 
                placeholder="Modelo" 
                className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-500/20"
                value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input 
                placeholder="Cor" 
                className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-500/20"
                value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
              />
              <input 
                placeholder="Placa" 
                className="bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-500/20"
                value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})}
              />
            </div>
            <button 
              onClick={handleAddVehicle}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              Salvar
            </button>
          </div>
        )}

        <div className="space-y-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 uppercase italic">{v.brand} {v.model}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase mt-1">{v.color} • {v.plate || 'S/ Placa'}</p>
              </div>
              <button onClick={() => handleDeleteVehicle(v.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Agendado!</h2>
            <p className="text-slate-500 text-sm mb-8">Sua solicitação foi enviada com sucesso. Acompanhe o status pelo histórico.</p>
            
            <button 
              onClick={() => { setSuccessModal(false); setActiveTab('history'); }}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest"
            >
              Ver Meus Agendamentos
            </button>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto min-h-screen relative">
        <div className="p-6 pt-[calc(env(safe-area-inset-top)+24px)]">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'book' && renderBook()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'vehicles' && renderVehicles()}
          
          <div className="py-8 text-center space-y-1 opacity-40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Desenvolvido por</p>
            <p className="text-xs font-bold text-slate-600">João Layón</p>
            <p className="text-[10px] text-slate-400">Fullstack Developer • DS Company</p>
          </div>
        </div>
        {renderBottomNav()}
      </div>
    </div>
  );
};
