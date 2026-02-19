
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FaturamentoList } from './components/FaturamentoList';
import { DespesasList } from './components/DespesasList';
import { Relatorios } from './components/Relatorios';
import { LandingPage } from './components/LandingPage';
import { AgendamentosList } from './components/AgendamentosList';
import { ClientArea } from './components/ClientArea';
import { AuthModal } from './components/AuthModal';
import { ServicesManager } from './components/ServicesManager';
import { SettingsManager } from './components/SettingsManager';

import { Faturamento, Despesa, Agendamento, User, CarSize, PaymentMethod, ServiceItem } from './types';
import { storage } from './services/storage';
import { Loader2, CloudOff, Cloud, RefreshCw } from 'lucide-react';

type View = 'dashboard' | 'faturamento' | 'despesas' | 'relatorios' | 'agenda' | 'servicos' | 'configuracoes';

const App: React.FC = () => {
  // Estado de Usuário (Login)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Dados
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());

  // Check for admin route on mount
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setIsAdminMode(true);
      setShowAuthModal(true);
    }
  }, []);

  // Função centralizada para carregar dados
  const loadData = useCallback(async (showMainLoader = false) => {
    if (showMainLoader) setIsLoading(true);
    setIsSyncing(true);
    
    try {
      if (storage.isCloud()) {
        await storage.init();
      }

      const [fat, desp, agenda, serv] = await Promise.all([
        storage.getFaturamento(),
        storage.getDespesas(),
        storage.getAgendamentos(),
        storage.getServices()
      ]);
      
      setFaturamentos(fat);
      setDespesas(desp);
      setAgendamentos(agenda);
      setServices(serv);
    } catch (err) {
      console.error("Falha ao sincronizar dados:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const keepAlive = async () => {
      const success = await storage.ping();
      if (success) setLastHeartbeat(Date.now());
    };
    keepAlive();
    const heartbeatInterval = setInterval(keepAlive, 300000);
    return () => clearInterval(heartbeatInterval);
  }, []);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      // Atualiza periodicamente para garantir que a agenda esteja atualizada para todos
      loadData(false);
    }, 15000); 
    return () => clearInterval(interval);
  }, [loadData, currentUser]);

  const handleUpdateFaturamento = async (items: Faturamento[]) => {
    const oldItems = faturamentos;
    setFaturamentos(items);
    const isDelete = items.length < oldItems.length;
    const affectedItem = isDelete 
      ? oldItems.find(o => !items.find(n => n.id === o.id))
      : items.find(n => !oldItems.find(o => o.id === n.id) || JSON.stringify(n) !== JSON.stringify(oldItems.find(o => o.id === n.id)));

    try {
      await storage.saveFaturamento(items, affectedItem, isDelete);
      await loadData(false);
    } catch (e) { await loadData(false); }
  };

  const handleUpdateDespesas = async (items: Despesa[]) => {
    const oldItems = despesas;
    setDespesas(items);
    const isDelete = items.length < oldItems.length;
    const affectedItem = isDelete 
      ? oldItems.find(o => !items.find(n => n.id === o.id))
      : items.find(n => !oldItems.find(o => o.id === n.id) || JSON.stringify(n) !== JSON.stringify(oldItems.find(o => o.id === n.id)));

    try {
      await storage.saveDespesas(items, affectedItem, isDelete);
      await loadData(false);
    } catch (e) { await loadData(false); }
  };

  const handleUpdateServices = async (items: ServiceItem[]) => {
      const oldItems = services;
      setServices(items);
      const isDelete = items.length < oldItems.length;
      
      // CORREÇÃO CRÍTICA: Lógica para detectar Edição vs Criação
      // Antes estava apenas comparando IDs, o que falhava na edição (ID igual)
      const affectedItem = isDelete 
        ? oldItems.find(o => !items.find(n => n.id === o.id))
        : items.find(n => {
            const old = oldItems.find(o => o.id === n.id);
            // Se não achar o antigo, é novo (true). Se achar e for diferente, é edição (true).
            return !old || JSON.stringify(n) !== JSON.stringify(old);
        });
      
      try {
          await storage.saveService(items, affectedItem, isDelete);
          await loadData(false);
      } catch(e) { await loadData(false); }
  };

  const handleUpdateAgendamentos = async (items: Agendamento[]) => {
    const oldItems = agendamentos;
    setAgendamentos(items);
    
    // 1. Detectar mudança para 'concluido' -> Dar Pontos
    const concludedItem = items.find(n => {
        const old = oldItems.find(o => o.id === n.id);
        return old && old.status !== 'concluido' && n.status === 'concluido';
    });

    // 2. Detectar mudança para 'confirmado' -> Gerar Faturamento (Contabilizar Lavagem)
    const confirmedItem = items.find(n => {
        const old = oldItems.find(o => o.id === n.id);
        return old && old.status !== 'confirmado' && n.status === 'confirmado';
    });

    try {
      // Lógica de Pontos ao Concluir
      if (concludedItem && concludedItem.userId) {
          await storage.addPoints(concludedItem.userId, 10);
      }

      // Lógica de Faturamento ao Confirmar (Solicitação do Usuário)
      if (confirmedItem && confirmedItem.valor > 0) {
          const novoFaturamento: Faturamento = {
              id: Math.random().toString(36).substr(2, 9),
              tipoLavagem: confirmedItem.servico,
              porte: CarSize.MEDIUM, 
              valor: confirmedItem.valor,
              pagamento: PaymentMethod.DINHEIRO, 
              data: new Date().toISOString() 
          };
          
          const novaListaFaturamento = [...faturamentos, novoFaturamento];
          setFaturamentos(novaListaFaturamento);
          await storage.saveFaturamento(novaListaFaturamento, novoFaturamento, false);
      }

      // Salva a alteração normal do agendamento
      const itemToSave = items.find(n => {
         const old = oldItems.find(o => o.id === n.id);
         return !old || JSON.stringify(old) !== JSON.stringify(n);
      });

      if (itemToSave) {
         await storage.saveAgendamento(items, itemToSave, false);
      }
      
      await loadData(false);
    } catch(e) { console.error(e); }
  };

  const handleClientSaveAgendamento = async (newItem: Agendamento) => {
      const newRequest = [...agendamentos, newItem];
      setAgendamentos(newRequest);
      await storage.saveAgendamento(newRequest, newItem, false);
      await loadData(false); 
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="font-black italic uppercase tracking-widest text-sm animate-pulse">Carregando Sistema...</p>
        </div>
      );
    }

    // Admin View - Only if logged in as admin
    if (currentUser?.role === 'admin') {
        return (
            <Layout currentView={currentView} setView={setCurrentView} userRole='admin'>
                {currentView === 'dashboard' && <Dashboard faturamentos={faturamentos} despesas={despesas} />}
                {currentView === 'agenda' && <AgendamentosList agendamentos={agendamentos} onUpdate={handleUpdateAgendamentos} services={services} />}
                {currentView === 'faturamento' && <FaturamentoList items={faturamentos} onUpdate={handleUpdateFaturamento} />}
                {currentView === 'despesas' && <DespesasList items={despesas} onUpdate={handleUpdateDespesas} />}
                {currentView === 'relatorios' && <Relatorios faturamentos={faturamentos} despesas={despesas} />}
                {currentView === 'servicos' && <ServicesManager services={services} onUpdate={handleUpdateServices} />}
                {currentView === 'configuracoes' && <SettingsManager />}
            </Layout>
        );
    }

    // Admin Login Mode - If on /admin and not logged in
    if (isAdminMode && !currentUser) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="text-center text-white">
               <p className="mb-4 font-bold uppercase tracking-widest text-xs opacity-50">Acesso Restrito</p>
               <button onClick={() => setShowAuthModal(true)} className="bg-blue-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all">
                 Fazer Login Admin
               </button>
            </div>
            {showAuthModal && (
              <AuthModal 
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  setShowAuthModal(false);
                  if (user.role === 'admin') setCurrentView('dashboard');
                }} 
                onClose={() => setShowAuthModal(false)} 
              />
            )}
         </div>
       );
    }

    // Client View (Logged in OR Guest)
    return (
        <>
          <ClientArea 
              currentUser={currentUser} 
              onSaveAgendamento={handleClientSaveAgendamento} 
              onLogout={() => setCurrentUser(null)} 
              onLoginRequest={() => setShowAuthModal(true)}
              existingAppointments={agendamentos} 
          />
          {showAuthModal && (
            <AuthModal 
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setShowAuthModal(false);
              }} 
              onClose={() => setShowAuthModal(false)} 
            />
          )}
        </>
    );
  };

  // Removed the blocking !currentUser check
  return (
    <div className="relative">
      {/* Status da Nuvem apenas para Admin */}
      {currentUser?.role === 'admin' && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none transition-all duration-500">
          <div className={`glass px-4 py-2 rounded-full flex items-center gap-3 border-white/20 shadow-2xl ${storage.isCloud() ? 'text-emerald-600' : 'text-amber-600'}`}>
            <div className="relative flex items-center justify-center">
              {isSyncing ? (
                <RefreshCw size={14} className="animate-spin text-blue-500" />
              ) : storage.isCloud() ? (
                <div className="relative">
                   <Cloud size={14} />
                   <div key={lastHeartbeat} className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
                </div>
              ) : (
                <CloudOff size={14} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black uppercase tracking-[0.2em] leading-tight">
                {isSyncing ? 'Sincronizando...' : storage.isCloud() ? 'Nuvem Conectada' : 'Offline (Local)'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
};

export default App;
