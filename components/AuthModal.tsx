
import React, { useState } from 'react';
import { User, ShieldCheck, ArrowRight, Lock, Gauge, Phone, Sparkles } from 'lucide-react';
import { storage } from '../services/storage';
import { User as UserType } from '../types';

interface AuthModalProps {
  onLoginSuccess: (user: UserType) => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (!phone || !password) {
      setError('Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const user = await storage.login(phone, password);
        if (user) {
          onLoginSuccess(user);
        } else {
          setError('Telefone ou senha incorretos.');
        }
      } else {
        if (!name) {
          setError('Nome é obrigatório para cadastro.');
          setLoading(false);
          return;
        }
        
        const newUser: UserType = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          phone,
          password,
          role: 'client',
          points: 0
        };

        const success = await storage.register(newUser);
        if (success) {
          onLoginSuccess(newUser);
        } else {
          setError('Este telefone já está cadastrado.');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro no sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 w-full h-32 bg-blue-600/10 -z-0" />
        
        <div className="p-8 relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Gauge size={32} className="text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-slate-900 uppercase italic tracking-tighter mb-2">
            Lava-jato Pro
          </h2>
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => { setMode('login'); setError(''); }} 
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'login' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setMode('register'); setError(''); }} 
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'register' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
            >
              Criar Conta
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <div className="animate-in slide-in-from-left-4 fade-in">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 text-sm"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                {mode === 'login' ? 'Telefone / Login' : 'Celular (WhatsApp)'}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 text-sm"
                  placeholder="Seu telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 text-sm"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {loading ? 'Processando...' : (mode === 'login' ? 'Acessar Sistema' : 'Cadastrar e Entrar')}
              {!loading && <ArrowRight size={16} />}
            </button>

            {mode === 'register' && (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
                 <Sparkles className="text-emerald-500 shrink-0" size={14} />
                 <p className="text-[9px] text-emerald-700 font-bold leading-relaxed">
                   Cadastre-se para acumular pontos de fidelidade e ganhar lavagens grátis!
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
