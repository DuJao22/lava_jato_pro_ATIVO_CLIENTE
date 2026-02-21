
import { Database } from '@sqlitecloud/drivers';
import { Faturamento, Despesa, Agendamento, User, ServiceItem, Vehicle, EstablishmentInfo } from '../types';

// Suppress internal SQLiteCloud disconnect logs that spam the console
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('SQLiteCloudConnection.connect - error connecting')) {
    return; // Ignore this specific internal driver error
  }
  if (args[0] && args[0] instanceof Error && args[0].message.includes('Disconnected')) {
    return; // Ignore disconnected error objects
  }
  originalConsoleError(...args);
};

const CONNECTION_STRING = (import.meta as any).env?.VITE_SQLITE_CLOUD_CONNECTION_STRING || "sqlitecloud://cbw4nq6vvk.g5.sqlite.cloud:8860/LavaJato_melhoria.db?apikey=CCfQtOyo5qbyni96cUwEdIG4q2MRcEXpRHGoNpELtNc";

const FATURAMENTO_KEY = 'lavajato_faturamento_v4';
const DESPESAS_KEY = 'lavajato_despesas_v4';
const AGENDAMENTOS_KEY = 'lavajato_agendamentos_v1';
const USERS_KEY = 'lavajato_users_v1';
const SERVICES_KEY = 'lavajato_services_v1';
const VEHICLES_KEY = 'lavajato_vehicles_v1';
const ESTABLISHMENT_KEY = 'lavajato_establishment_v1';

let db: any = null;
let isConnecting = false;

const connectDb = async () => {
  if (!CONNECTION_STRING) return null;
  try {
    const newDb = new Database(CONNECTION_STRING);
    // Force connection attempt and catch any immediate errors
    await newDb.sql`SELECT 1`;
    return newDb;
  } catch (e) {
    // Suppress connection errors to avoid console spam when offline
    return null;
  }
};

const getDb = async () => {
  if (!CONNECTION_STRING) return null;
  
  if (db) {
    try {
      // Fast ping to check if connection is alive
      await db.sql`SELECT 1`;
      return db;
    } catch (e) {
      // Connection died, reset it
      db = null;
    }
  }
  
  if (!db && !isConnecting) {
    isConnecting = true;
    try {
      db = await connectDb();
      if (db) console.log("Conectado ao SQLite Cloud");
    } finally {
      isConnecting = false;
    }
  }
  
  return db;
};

export const storage = {
  isCloud: () => !!CONNECTION_STRING && !!db,

  init: async () => {
    const currentDb = await getDb();
    if (!currentDb) return;
    try {
      // 1. Tabela Users
      await currentDb.sql`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        points INTEGER DEFAULT 0
      )`;

      // 2. Admin Default
      const targetAdmin = await currentDb.sql`SELECT * FROM users WHERE phone = 'Dujao' LIMIT 1`;
      if (!targetAdmin || targetAdmin.length === 0) {
        const adminId = Math.random().toString(36).substr(2, 9);
        await currentDb.sql`INSERT INTO users (id, name, phone, password, role, points) VALUES (${adminId}, 'Administrador', 'Dujao', '3003', 'admin', 0)`;
      }

      // 3. Agendamentos
      await currentDb.sql`CREATE TABLE IF NOT EXISTS agendamentos (
        id TEXT PRIMARY KEY,
        userId TEXT,
        clienteNome TEXT NOT NULL,
        clienteTelefone TEXT NOT NULL,
        servico TEXT NOT NULL,
        valor REAL DEFAULT 0,
        dataAgendamento TEXT NOT NULL,
        status TEXT NOT NULL,
        criadoEm TEXT NOT NULL,
        veiculoSnapshot TEXT
      )`;

      // Migrations Agendamentos
      try { await currentDb.sql`ALTER TABLE agendamentos ADD COLUMN userId TEXT`; } catch (e) {}
      try { await currentDb.sql`ALTER TABLE agendamentos ADD COLUMN valor REAL DEFAULT 0`; } catch (e) {}
      try { await currentDb.sql`ALTER TABLE agendamentos ADD COLUMN veiculoSnapshot TEXT`; } catch (e) {}

      // 4. Serviços
      await currentDb.sql`CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        priceMedium REAL,
        priceLarge REAL,
        oldPrice REAL
      )`;
      
      try { await currentDb.sql`ALTER TABLE services ADD COLUMN oldPrice REAL`; } catch (e) {}
      try { await currentDb.sql`ALTER TABLE services ADD COLUMN priceMedium REAL`; } catch (e) {}
      try { await currentDb.sql`ALTER TABLE services ADD COLUMN priceLarge REAL`; } catch (e) {}

      const servicesCount = await currentDb.sql`SELECT count(*) as count FROM services`;
      if (servicesCount[0].count === 0) {
          await currentDb.sql`INSERT INTO services (id, label, description, price, priceMedium, priceLarge, oldPrice) VALUES 
          ('simples', 'Lavagem Simples', 'Ducha + Secagem', 30, 40, 50, 40),
          ('completa', 'Lavagem Completa', 'Int. + Ext. + Cera', 60, 70, 80, 70),
          ('higienizacao', 'Higienização', 'Bancos + Teto', 250, 270, 300, 300),
          ('polimento', 'Polimento Técnico', 'Revitalização', 350, 380, 420, 400)`;
      }

      // 5. Veículos
      await currentDb.sql`CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year TEXT NOT NULL,
        color TEXT NOT NULL,
        plate TEXT,
        size TEXT NOT NULL
      )`;

      await currentDb.sql`CREATE TABLE IF NOT EXISTS faturamento (
        id TEXT PRIMARY KEY,
        tipoLavagem TEXT NOT NULL,
        porte TEXT NOT NULL,
        valor REAL NOT NULL,
        pagamento TEXT NOT NULL,
        data TEXT NOT NULL
      )`;

      await currentDb.sql`CREATE TABLE IF NOT EXISTS despesas (
        id TEXT PRIMARY KEY,
        valor REAL NOT NULL,
        observacao TEXT,
        data TEXT NOT NULL
      )`;

      // 6. Estabelecimento
      await currentDb.sql`CREATE TABLE IF NOT EXISTS establishment (
        id TEXT PRIMARY KEY,
        name TEXT,
        address TEXT,
        phone TEXT,
        instagram TEXT,
        logoUrl TEXT,
        wazeUrl TEXT
      )`;
      
      console.log("Schema verificado.");
    } catch (e) {
      // Suppress auto-migration errors if connection drops
    }
  },

  ping: async (): Promise<boolean> => {
    const currentDb = await getDb();
    if (currentDb) {
      try { await currentDb.sql`SELECT 1`; return true; } catch (e) { return false; }
    }
    return false;
  },

  // --- ESTABELECIMENTO ---
  getEstablishmentInfo: async (): Promise<EstablishmentInfo> => {
    const defaultInfo: EstablishmentInfo = {
      name: 'Lava Jato Pro',
      address: 'Rua Exemplo, 123 - Centro',
      phone: '5531999999999',
      instagram: '@lavajato',
      wazeUrl: ''
    };

    const currentDb = await getDb();
    if (currentDb) {
      try {
        const res = await currentDb.sql`SELECT * FROM establishment LIMIT 1`;
        if (res && res.length > 0) return res[0] as EstablishmentInfo;
      } catch (e) { /* fallback */ }
    }
    
    const local = localStorage.getItem(ESTABLISHMENT_KEY);
    return local ? JSON.parse(local) : defaultInfo;
  },

  saveEstablishmentInfo: async (info: EstablishmentInfo): Promise<boolean> => {
    localStorage.setItem(ESTABLISHMENT_KEY, JSON.stringify(info));
    const currentDb = await getDb();
    if (currentDb) {
      try {
        // Ensure table exists (redundancy check)
        await currentDb.sql`CREATE TABLE IF NOT EXISTS establishment (
            id TEXT PRIMARY KEY,
            name TEXT,
            address TEXT,
            phone TEXT,
            instagram TEXT,
            logoUrl TEXT,
            wazeUrl TEXT
        )`;

        await currentDb.sql`INSERT OR REPLACE INTO establishment (id, name, address, phone, instagram, logoUrl, wazeUrl)
                     VALUES ('1', ${info.name}, ${info.address}, ${info.phone}, ${info.instagram}, ${info.logoUrl || ''}, ${info.wazeUrl || ''})`;
        return true;
      } catch (e) { 
        return false; 
      }
    }
    return true;
  },

  // --- USERS ---
  login: async (phone: string, password: string): Promise<User | null> => {
    const currentDb = await getDb();
    if (currentDb) {
      try {
        const result = await currentDb.sql`SELECT * FROM users WHERE phone = ${phone} AND password = ${password} LIMIT 1`;
        if (result && result.length > 0) return result[0] as User;
      } catch (e) { /* fallback */ }
    }
    if (phone === 'Dujao' && password === '3003') {
      return { id: 'local-admin', name: 'Administrador (Local)', phone: 'Dujao', role: 'admin', points: 0 };
    }
    const localUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return localUsers.find((u: User) => u.phone === phone && u.password === password) || null;
  },

  register: async (user: User): Promise<boolean> => {
    const currentDb = await getDb();
    if (currentDb) {
      try {
        await currentDb.sql`INSERT INTO users (id, name, phone, password, role, points) VALUES (${user.id}, ${user.name}, ${user.phone}, ${user.password}, ${user.role}, ${user.points})`;
        return true;
      } catch (e) { return false; }
    }
    const localUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (localUsers.find((u: User) => u.phone === user.phone)) return false;
    localUsers.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(localUsers));
    return true;
  },

  addPoints: async (userId: string, points: number): Promise<void> => {
    const currentDb = await getDb();
    if (currentDb) {
      try { await currentDb.sql`UPDATE users SET points = points + ${points} WHERE id = ${userId}`; } catch(e) {}
    }
  },

  getUser: async (userId: string): Promise<User | null> => {
    const currentDb = await getDb();
    if(currentDb) {
      try {
        const res = await currentDb.sql`SELECT * FROM users WHERE id = ${userId}`;
        return res[0] as User;
      } catch(e) { return null; }
    }
    return null;
  },

  // --- VEÍCULOS (NOVO) ---
  getUserVehicles: async (userId: string): Promise<Vehicle[]> => {
    const currentDb = await getDb();
    if (currentDb) {
      try {
        return await currentDb.sql`SELECT * FROM vehicles WHERE userId = ${userId}`;
      } catch (e) { /* fallback */ }
    }
    const local = JSON.parse(localStorage.getItem(VEHICLES_KEY) || '[]');
    return local.filter((v: Vehicle) => v.userId === userId);
  },

  addVehicle: async (vehicle: Vehicle): Promise<void> => {
    const currentDb = await getDb();
    if (currentDb) {
      try {
        await currentDb.sql`INSERT INTO vehicles (id, userId, brand, model, year, color, plate, size) 
                     VALUES (${vehicle.id}, ${vehicle.userId}, ${vehicle.brand}, ${vehicle.model}, ${vehicle.year}, ${vehicle.color}, ${vehicle.plate}, ${vehicle.size})`;
      } catch (e) { /* fallback */ }
    }
    // Local fallback
    const local = JSON.parse(localStorage.getItem(VEHICLES_KEY) || '[]');
    local.push(vehicle);
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(local));
  },

  deleteVehicle: async (id: string): Promise<void> => {
     const currentDb = await getDb();
     if(currentDb) {
       try { await currentDb.sql`DELETE FROM vehicles WHERE id = ${id}`; } catch(e) {}
     }
     const local = JSON.parse(localStorage.getItem(VEHICLES_KEY) || '[]');
     localStorage.setItem(VEHICLES_KEY, JSON.stringify(local.filter((v: Vehicle) => v.id !== id)));
  },

  // --- SERVIÇOS ---
  getServices: async (): Promise<ServiceItem[]> => {
    const currentDb = await getDb();
    if (currentDb) {
        try { return await currentDb.sql`SELECT * FROM services ORDER BY price ASC`; } catch (e) {}
    }
    const local = localStorage.getItem(SERVICES_KEY);
    if (!local) {
        return [
            { id: 'simples', label: 'Lavagem Simples', description: 'Ducha + Secagem', price: 40 },
            { id: 'completa', label: 'Lavagem Completa', description: 'Int. + Ext. + Cera', price: 70 },
            { id: 'higienizacao', label: 'Higienização', description: 'Bancos + Teto', price: 250 }
        ];
    }
    return JSON.parse(local);
  },

  saveService: async (items: ServiceItem[], lastItem?: ServiceItem, isDelete?: boolean): Promise<void> => {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(items));
    const currentDb = await getDb();
    if (currentDb && lastItem) {
        try {
            if (isDelete) {
                await currentDb.sql`DELETE FROM services WHERE id = ${lastItem.id}`;
            } else {
                await currentDb.sql`INSERT OR REPLACE INTO services (id, label, description, price, priceMedium, priceLarge, oldPrice) 
                             VALUES (${lastItem.id}, ${lastItem.label}, ${lastItem.description}, ${lastItem.price}, ${lastItem.priceMedium || null}, ${lastItem.priceLarge || null}, ${lastItem.oldPrice || null})`;
            }
        } catch(e) { /* fallback */ }
    }
  },

  // --- FATURAMENTO ---
  getFaturamento: async (): Promise<Faturamento[]> => {
    const currentDb = await getDb();
    if (currentDb) {
      try {
        const results = await currentDb.sql`SELECT * FROM faturamento ORDER BY data DESC`;
        return results || [];
      } catch (e) { /* fallback */ }
    }
    const local = localStorage.getItem(FATURAMENTO_KEY);
    return local ? JSON.parse(local) : [];
  },

  saveFaturamento: async (items: Faturamento[], lastItem?: Faturamento, isDelete?: boolean): Promise<void> => {
    localStorage.setItem(FATURAMENTO_KEY, JSON.stringify(items));
    const currentDb = await getDb();
    if (currentDb && lastItem) {
      try {
        if (isDelete) {
          await currentDb.sql`DELETE FROM faturamento WHERE id = ${lastItem.id}`;
        } else {
          await currentDb.sql`
            INSERT OR REPLACE INTO faturamento (id, tipoLavagem, porte, valor, pagamento, data)
            VALUES (${lastItem.id}, ${lastItem.tipoLavagem}, ${lastItem.porte}, ${lastItem.valor}, ${lastItem.pagamento}, ${lastItem.data})
          `;
        }
      } catch (e) { /* fallback */ }
    }
  },

  // --- DESPESAS ---
  getDespesas: async (): Promise<Despesa[]> => {
    const currentDb = await getDb();
    if (currentDb) {
      try {
        const results = await currentDb.sql`SELECT * FROM despesas ORDER BY data DESC`;
        return results || [];
      } catch (e) { /* fallback */ }
    }
    const local = localStorage.getItem(DESPESAS_KEY);
    return local ? JSON.parse(local) : [];
  },

  saveDespesas: async (items: Despesa[], lastItem?: Despesa, isDelete?: boolean): Promise<void> => {
    localStorage.setItem(DESPESAS_KEY, JSON.stringify(items));
    const currentDb = await getDb();
    if (currentDb && lastItem) {
      try {
        if (isDelete) {
          await currentDb.sql`DELETE FROM despesas WHERE id = ${lastItem.id}`;
        } else {
          await currentDb.sql`
            INSERT OR REPLACE INTO despesas (id, valor, observacao, data)
            VALUES (${lastItem.id}, ${lastItem.valor}, ${lastItem.observacao}, ${lastItem.data})
          `;
        }
      } catch (e) { /* fallback */ }
    }
  },

  // --- AGENDAMENTOS ---
  getAgendamentos: async (): Promise<Agendamento[]> => {
    const currentDb = await getDb();
    if (currentDb) {
      try {
        const results = await currentDb.sql`SELECT * FROM agendamentos ORDER BY dataAgendamento ASC`;
        return results || [];
      } catch (e) { /* fallback */ }
    }
    const local = localStorage.getItem(AGENDAMENTOS_KEY);
    return local ? JSON.parse(local) : [];
  },

  saveAgendamento: async (items: Agendamento[], lastItem?: Agendamento, isDelete?: boolean): Promise<void> => {
    localStorage.setItem(AGENDAMENTOS_KEY, JSON.stringify(items));
    const currentDb = await getDb();
    if (currentDb && lastItem) {
      try {
        if (isDelete) {
          await currentDb.sql`DELETE FROM agendamentos WHERE id = ${lastItem.id}`;
        } else {
          const userId = lastItem.userId || null;
          const valor = lastItem.valor || 0;
          const veiculo = lastItem.veiculoSnapshot || '';
          
          await currentDb.sql`
            INSERT OR REPLACE INTO agendamentos (id, userId, clienteNome, clienteTelefone, servico, valor, dataAgendamento, status, criadoEm, veiculoSnapshot)
            VALUES (${lastItem.id}, ${userId}, ${lastItem.clienteNome}, ${lastItem.clienteTelefone}, ${lastItem.servico}, ${valor}, ${lastItem.dataAgendamento}, ${lastItem.status}, ${lastItem.criadoEm}, ${veiculo})
          `;
        }
      } catch (e) { /* fallback */ }
    }
  }
};
