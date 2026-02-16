
-- SCRIPT DE CRIAÇÃO PARA SQLITE CLOUD
-- Execute no SQL Editor do SQLite Cloud

-- Tabela de Usuários (Login e Fidelidade)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE, -- Telefone será o Login
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin' ou 'client'
    points INTEGER DEFAULT 0
);

-- Tabela de Faturamento (Lavagens Realizadas)
CREATE TABLE IF NOT EXISTS faturamento (
    id TEXT PRIMARY KEY,
    tipoLavagem TEXT NOT NULL,
    porte TEXT NOT NULL,
    valor REAL NOT NULL,
    pagamento TEXT NOT NULL,
    data TEXT NOT NULL
);

-- Tabela de Despesas (Gastos)
CREATE TABLE IF NOT EXISTS despesas (
    id TEXT PRIMARY KEY,
    valor REAL NOT NULL,
    observacao TEXT,
    data TEXT NOT NULL
);

-- NOVA TABELA: Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id TEXT PRIMARY KEY,
    userId TEXT, -- FK para users
    clienteNome TEXT NOT NULL,
    clienteTelefone TEXT NOT NULL,
    servico TEXT NOT NULL,
    dataAgendamento TEXT NOT NULL,
    status TEXT NOT NULL,
    criadoEm TEXT NOT NULL
);

-- Indexação
CREATE INDEX IF NOT EXISTS idx_faturamento_data ON faturamento(data);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(dataAgendamento);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
