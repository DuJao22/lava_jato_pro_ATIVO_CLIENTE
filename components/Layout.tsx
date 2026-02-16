
import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Receipt, 
  FileBarChart, 
  Gauge,
  CalendarDays,
  Settings
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
  userRole: UserRole;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, userRole }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Início', shortLabel: 'Painel', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', shortLabel: 'Agenda', icon: CalendarDays }, 
    { id: 'faturamento', label: 'Lavagens', shortLabel: 'Lavar', icon: Car },
    { id: 'despesas', label: 'Gastos', shortLabel: 'Gastos', icon: Receipt },
    { id: 'relatorios', label: 'Relatórios', shortLabel: 'Relats', icon: FileBarChart },
    { id: 'servicos', label: 'Serviços', shortLabel: 'Preços', icon: Settings }, // Novo item
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden bg-transparent">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 glass-dark text-white m-4 rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/50">
            <Gauge className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">Lava-jato</span>
            <span className="block text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase -mt-1">Pro Edition</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 border ${
                  isActive 
                    ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/40 translate-x-2' 
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/5">
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center">João Layón © 2025</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen pb-[120px] md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden pt-[var(--safe-top)] px-6 py-5 flex items-center justify-between sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Gauge size={20} className="text-white" />
             </div>
             <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
               {menuItems.find(m => m.id === currentView)?.label}
               <span className="block text-[8px] text-blue-500 tracking-[0.2em] font-black not-italic">Lava-jato Pro</span>
             </h1>
           </div>
           <div className="text-[10px] font-black text-white uppercase bg-blue-600/20 px-4 py-2 rounded-full border border-blue-500/30">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
           </div>
        </header>

        {/* Page Title - Desktop Only */}
        <header className="hidden md:flex h-24 items-center px-12 justify-between">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{currentView}</h2>
        </header>

        <div className="flex-1 px-4 md:px-12 py-4">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile (High Contrast Edition) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/10 ios-bottom-nav px-4">
        <div className="flex items-center justify-around py-3 max-w-lg mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-14 ${
                  isActive ? 'translate-y-[-8px]' : 'text-slate-400'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] scale-110' 
                    : 'bg-white/5 text-slate-400'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                </div>
                {isActive && (
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse absolute -bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
