import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Room {
  id: string;
  name: string;
  area: number;
}

export interface ProjectMember {
  id: string;
  email: string;
  name?: string;
  role: 'team' | 'client' | 'contractor';
  status: 'active' | 'invited';
  invitedAt: string;
  acceptedAt?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  client: string;
  address: string;
  area: number;
  totalBudget: number;
  currency: string;
  description: string;
  rooms: Room[];
  categories?: string[];
  ownerId: string;
  ownerEmail: string;
  members: ProjectMember[];
  status: 'active' | 'completed' | 'archived';
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  createdAt: string;
}

export interface InvitationRecord {
  id: string;
  projectId: string;
  projectName: string;
  inviterEmail: string;
  email: string;
  role: 'team' | 'client' | 'contractor';
  token: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface SessionData {
  token: string;
  email: string;
  role: 'team' | 'client' | 'contractor';
  isAdmin: boolean;
  projectId?: string;
  createdAt: string;
}

export interface AccessRequestRecord {
  id: string;
  projectId: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role?: 'team' | 'client' | 'contractor';
  createdAt: string;
  resolvedAt?: string;
}

export interface DatabaseData {
  users: Record<string, UserRecord>;
  projects: Record<string, ProjectRecord>;
  items: Record<string, any[]>;
  invitations: Record<string, InvitationRecord>;
  sessions: Record<string, SessionData>;
  accessRequests: Record<string, AccessRequestRecord[]>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial seed data
const DEFAULT_ROOMS: Room[] = [
  { id: 'room-1', name: 'Кухня-гостиная', area: 36.0 },
  { id: 'room-2', name: 'Мастер-спальня', area: 18.5 },
  { id: 'room-3', name: 'Прихожая и коридор', area: 11.2 },
  { id: 'room-4', name: 'Мастер-санузел', area: 7.4 },
  { id: 'room-5', name: 'Гостевой санузел', area: 4.8 },
  { id: 'room-6', name: 'Кабинет / Гостевая', area: 16.6 },
];

const DEFAULT_PROJECT_1: ProjectRecord = {
  id: 'proj-1',
  name: 'ЖК «Highvill Park», кв. 84 — Современный уют',
  client: 'Азамат и Дана Сериковы',
  address: 'г. Астана, пр. Кабанбай батыра, д. 42',
  area: 112.0,
  totalBudget: 28500000,
  currency: '₸',
  description: 'Комплектация дизайн-проекта: итальянская мебель, отделочные материалы, трековое освещение и сантехника',
  rooms: DEFAULT_ROOMS,
  categories: ['Мебель', 'Освещение', 'Сантехника', 'Отделочные материалы', 'Двери и столярка', 'Текстиль и декор', 'Бытовая техника', 'Климат и отопление'],
  ownerId: 'xGO6LCUDwJa1e5o8LWhmN26LyJL2',
  ownerEmail: 'wl.chvlad@gmail.com',
  members: [
    {
      id: 'mem-1',
      email: 'client@complspec.kz',
      name: 'Дана Серикова',
      role: 'client',
      status: 'active',
      invitedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    },
    {
      id: 'mem-2',
      email: 'contractor@complspec.kz',
      name: 'ТОО «Interier Service»',
      role: 'contractor',
      status: 'active',
      invitedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    }
  ],
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_PROJECT_2: ProjectRecord = {
  id: 'proj-2',
  name: 'Вилла в предгорье «Remizovka» — Неоклассика',
  client: 'Нурлан Ахметов',
  address: 'г. Алматы, мкр. Ремизовка, ул. Горная, 15',
  area: 280.0,
  totalBudget: 65000000,
  currency: '₸',
  description: 'Премиальная комплектация загородной резиденции: мрамор, натуральный шпон, заказная столярка',
  rooms: [
    { id: 'room-201', name: 'Холл и парадная лестница', area: 38.0 },
    { id: 'room-202', name: 'Гостиная со вторым светом', area: 64.0 },
    { id: 'room-203', name: 'Кухня и столовая', area: 42.0 },
    { id: 'room-204', name: 'Мастер-сьют с гардеробной', area: 45.0 },
    { id: 'room-205', name: 'SPA-зона и сауна', area: 28.0 },
  ],
  categories: ['Мебель', 'Освещение', 'Сантехника', 'Отделочные материалы', 'Двери и столярка', 'Текстиль и декор', 'Бытовая техника'],
  ownerId: 'xGO6LCUDwJa1e5o8LWhmN26LyJL2',
  ownerEmail: 'wl.chvlad@gmail.com',
  members: [],
  status: 'active',
  createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
};

const INITIAL_PROJECT_1_ITEMS = [
  {
    id: 'item-1',
    projectId: 'proj-1',
    code: 'М-01',
    name: 'Диван угловой модульный Taiki',
    roomId: 'room-1',
    roomName: 'Кухня-гостиная',
    category: 'Мебель',
    subcategory: 'Мягкая мебель',
    brand: 'Lema',
    article: 'TK-MOD-320',
    dimensions: '3200 × 1850 × 780 мм',
    finish: 'Фактурное букле, оттенок Овсяный (Oatmeal 04), ножки темный орех',
    quantity: 1,
    unit: 'шт',
    basePrice: 2850000,
    supplierDiscount: 15,
    mainPhoto: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=85',
    additionalPhotos: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=85',
    ],
    status: 'approved',
    clientStatus: 'approved',
    clientComment: 'Цвет ткани утвердили с образца в студии',
    deliveryTime: '6-8 недель',
    supplier: 'Салон Flat Interiors, менеджер Анна (+7 701 442-12-88)',
    link: 'https://www.lema.it/en/products/sofas/taiki',
    techNotes: 'Занести через грузовой лифт по секциям. Розетки 220V под диваном на высоте 100 мм от чистого пола.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-2',
    projectId: 'proj-1',
    code: 'СВ-01',
    name: 'Подвесной светильник над островом Noctambule',
    roomId: 'room-1',
    roomName: 'Кухня-гостиная',
    category: 'Освещение',
    subcategory: 'Подвесные светильники',
    brand: 'Flos (Константин Грчич)',
    article: 'F0273000',
    dimensions: 'D 390 мм, высота подвеса 1600 мм',
    finish: 'Выдувное боросиликатное стекло ручной работы, черный анодированный алюминий',
    quantity: 2,
    unit: 'шт',
    basePrice: 1250000,
    supplierDiscount: 12,
    mainPhoto: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&auto=format&fit=crop&q=85',
    additionalPhotos: [],
    status: 'invoice_issued',
    clientStatus: 'approved',
    deliveryTime: 'В наличии в Алматы',
    supplier: 'Lumen Gallery, менеджер Тимур',
    link: 'https://flos.com/en/noctambule-cylinder-high-cone',
    techNotes: 'Закладная в ГКЛ потолке выдерживает нагрузку до 15 кг. Диммирование DALI.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-3',
    projectId: 'proj-1',
    code: 'ОТД-01',
    name: 'Керамогранит крупноформатный Invisible White Silk',
    roomId: 'room-4',
    roomName: 'Мастер-санузел',
    category: 'Отделочные материалы',
    subcategory: 'Керамогранит',
    brand: 'Florim (Италия)',
    article: '765412',
    dimensions: '1200 × 2800 × 6 мм',
    finish: 'Сатинированная поверхность, имитация белого мрамора Calacatta с серыми прожилками',
    quantity: 48,
    unit: 'м²',
    basePrice: 38500,
    supplierDiscount: 10,
    mainPhoto: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=85',
    additionalPhotos: [],
    status: 'paid_in_production',
    clientStatus: 'approved',
    deliveryTime: 'Отгрузка со склада через 3 дня',
    supplier: 'Kerama Premium, склад Астана',
    link: 'https://www.florim.com/ru/invisible-white',
    techNotes: 'Раскладка «бабочка» на центральной стене за ванной. Запил внешних углов под 45 градусов.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-4',
    projectId: 'proj-1',
    code: 'САН-01',
    name: 'Ванна отдельностоящая из каменного литья BetteStarlet Oval',
    roomId: 'room-4',
    roomName: 'Мастер-санузел',
    category: 'Сантехника',
    subcategory: 'Ванны',
    brand: 'Bette (Германия)',
    article: 'BETTE-6650-000',
    dimensions: '1750 × 800 × 450 мм',
    finish: 'Глазурованная титановая сталь, покрытие BetteAntigliss, цвет Белый глянцевый',
    quantity: 1,
    unit: 'шт',
    basePrice: 1980000,
    supplierDiscount: 14,
    mainPhoto: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=85',
    additionalPhotos: [],
    status: 'approved',
    clientStatus: 'approved',
    deliveryTime: '4 недели из Германии',
    supplier: 'Aura Bathrooms',
    link: 'https://www.my-bette.com/en/products/baths/bette-starlet-oval',
    techNotes: 'Монтаж в пол встроенного смесителя. Трап с сухим гидрозатвором под чашей.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-5',
    projectId: 'proj-1',
    code: 'СТ-01',
    name: 'Гардеробная система со стеклянными фасадами Cover',
    roomId: 'room-2',
    roomName: 'Мастер-спальня',
    category: 'Двери и столярка',
    subcategory: 'Гардеробные',
    brand: 'Rimadesio',
    article: 'COV-SYS-09',
    dimensions: '3600 × 600 × 2750 мм',
    finish: 'Тонированное серье стекло Grigio Riflettente, матовый профиль Piombo, шпон дуба',
    quantity: 1,
    unit: 'компл.',
    basePrice: 6200000,
    supplierDiscount: 18,
    mainPhoto: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?w=1200&auto=format&fit=crop&q=85',
    additionalPhotos: [],
    status: 'in_selection',
    clientStatus: 'attention',
    clientComment: 'Уточнить высоту полок под обувь и тип подсветки штанг',
    deliveryTime: '10-12 недель',
    supplier: 'Rimadesio Flagship Store',
    link: 'https://www.rimadesio.it/en/products/cover/',
    techNotes: 'Интегрированная вертикальная LED-подсветка с датчиком открывания дверей. Вывод 24V в левый верхний угол.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_PROJECT_2_ITEMS = [
  {
    id: 'item-201',
    projectId: 'proj-2',
    code: 'ЛЮС-01',
    name: 'Люстра каскадная со стеклом Murano',
    roomId: 'room-202',
    roomName: 'Гостиная со вторым светом',
    category: 'Освещение',
    subcategory: 'Люстры',
    brand: 'Barovier & Toso',
    article: 'BT-CASC-01',
    dimensions: 'D 1400 мм, H 2800 мм',
    finish: 'Венецианское стекло ручной выдувки, матовая латунь',
    quantity: 1,
    unit: 'шт',
    basePrice: 14500000,
    supplierDiscount: 15,
    mainPhoto: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1200&auto=format&fit=crop&q=85',
    additionalPhotos: [],
    status: 'approved',
    clientStatus: 'approved',
    deliveryTime: '8 недель',
    supplier: 'Grand Light Almaty',
    link: 'https://www.barovier.com',
    techNotes: 'Усиленная анкерная балка на кровле под нагрузку 80 кг. Лебедка для обслуживания.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-202',
    projectId: 'proj-2',
    code: 'М-201',
    name: 'Обеденный стол из массива американского ореха и мрамора',
    roomId: 'room-203',
    roomName: 'Кухня и столовая',
    category: 'Мебель',
    subcategory: 'Столовые группы',
    brand: 'Poliform',
    article: 'CONCORDE-340',
    dimensions: '3400 × 1200 × 740 мм',
    finish: 'Столешница мрамор Sahara Noir полированный, опора орех canaletto',
    quantity: 1,
    unit: 'шт',
    basePrice: 7800000,
    supplierDiscount: 12,
    mainPhoto: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&auto=format&fit=crop&q=85',
    additionalPhotos: [],
    status: 'in_selection',
    clientStatus: 'pending',
    deliveryTime: '6-8 недель',
    supplier: 'Poliform Almaty',
    link: 'https://www.poliform.it',
    techNotes: 'Вес столешницы 220 кг. Спецтехника для подъема через панорамное окно террасы.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

class DatabaseManager {
  private data: DatabaseData;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Migrate: ensure new fields exist on older DB files
        if (!parsed.sessions) parsed.sessions = {};
        if (!parsed.accessRequests) parsed.accessRequests = {};
        return parsed;
      }
    } catch (err) {
      console.error('[DB] Failed to load database file, initializing defaults:', err);
    }

    const initialData: DatabaseData = {
      users: {
        'default-user': {
          id: 'default-user',
          email: 'demo@complspec.kz',
          name: 'Дизайн-студия COMPLSPEC',
          role: 'team',
          createdAt: new Date().toISOString(),
        }
      },
      projects: {
        'proj-1': DEFAULT_PROJECT_1,
        'proj-2': DEFAULT_PROJECT_2,
      },
      items: {
        'proj-1': INITIAL_PROJECT_1_ITEMS,
        'proj-2': INITIAL_PROJECT_2_ITEMS,
      },
      invitations: {},
      sessions: {},
      accessRequests: {},
    };

    this.saveDirect(initialData);
    return initialData;
  }

  private saveDirect(data: DatabaseData) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to write database file:', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // --- Users ---
  public getOrCreateUser(userData: { id: string; email: string; name?: string; avatar?: string }): UserRecord {
    const existing = Object.values(this.data.users).find(
      (u) => u.id === userData.id || (u.email && u.email.toLowerCase() === userData.email.toLowerCase())
    );

    if (existing) {
      existing.name = userData.name || existing.name;
      if (userData.avatar) existing.avatar = userData.avatar;
      this.save();
      return existing;
    }

    const newUser: UserRecord = {
      id: userData.id || `user-${Date.now()}`,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      avatar: userData.avatar,
      createdAt: new Date().toISOString(),
    };

    this.data.users[newUser.id] = newUser;

    // Check if this new user has pending invitations
    this.resolveInvitationsForUser(newUser.email, newUser.name);

    this.save();
    return newUser;
  }

  // --- Projects ---
  public getProjectsForUser(userId?: string, userEmail?: string): (ProjectRecord & { itemsCount: number; userRoleInProject: 'team' | 'client' | 'contractor' })[] {
    const list = Object.values(this.data.projects);
    const cleanEmail = (userEmail || '').toLowerCase().trim();

    // Master studio admin/moderator who owns and sees all projects
    const adminEmail = (process.env.ADMIN_EMAIL || 'wl.chvlad@gmail.com').toLowerCase().trim();
    const isMasterAdmin = cleanEmail === adminEmail;

    return list
      .filter((p) => {
        // Master admin sees ALL projects without exception
        if (isMasterAdmin) return true;

        // If no user specified at all (unauthenticated / demo), return all projects for demo preview
        if (!userId && !cleanEmail) return true;

        // Project creator/owner sees their project
        const isOwner =
          (userId && p.ownerId === userId) ||
          (cleanEmail && p.ownerEmail && p.ownerEmail.toLowerCase().trim() === cleanEmail);
        if (isOwner) return true;

        // Invited members see this project
        const isMember =
          p.members &&
          p.members.some((m) => m.email && m.email.toLowerCase().trim() === cleanEmail);
        if (isMember) return true;

        // Otherwise this project is completely hidden from this user
        return false;
      })
      .map((p) => {
        const items = this.data.items[p.id] || [];
        let role: 'team' | 'client' | 'contractor' = 'client';

        if (isMasterAdmin || (cleanEmail && p.ownerEmail && p.ownerEmail.toLowerCase().trim() === cleanEmail)) {
          role = 'team';
        } else if (cleanEmail) {
          const member = p.members?.find((m) => m.email && m.email.toLowerCase().trim() === cleanEmail);
          if (member) {
            role = member.role;
          }
        }

        return {
          ...p,
          itemsCount: items.length,
          userRoleInProject: role,
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getProject(projectId: string): { project: ProjectRecord; items: any[] } | null {
    const project = this.data.projects[projectId];
    if (!project) return null;
    const items = this.data.items[projectId] || [];
    return { project, items };
  }

  public createProject(projectData: Partial<ProjectRecord>, creator: { id: string; email: string; name?: string }): { project: ProjectRecord; items: any[] } {
    const id = `proj-${Date.now()}`;
    const newProject: ProjectRecord = {
      id,
      name: projectData.name?.trim() || 'Новый дизайн-проект',
      client: projectData.client?.trim() || 'Заказчик',
      address: projectData.address?.trim() || 'г. Алматы',
      area: Number(projectData.area) || 90.0,
      totalBudget: Number(projectData.totalBudget) || 20000000,
      currency: '₸',
      description: projectData.description?.trim() || 'Спецификация отделки, мебели и оборудования',
      rooms: projectData.rooms && projectData.rooms.length > 0 ? projectData.rooms : [
        { id: `r-${Date.now()}-1`, name: 'Кухня-гостиная', area: 32.0 },
        { id: `r-${Date.now()}-2`, name: 'Мастер-спальня', area: 18.0 },
        { id: `r-${Date.now()}-3`, name: 'Санузел', area: 6.5 },
        { id: `r-${Date.now()}-4`, name: 'Прихожая', area: 8.0 },
      ],
      categories: projectData.categories || ['Мебель', 'Освещение', 'Сантехника', 'Отделочные материалы', 'Двери и столярка', 'Текстиль и декор', 'Бытовая техника'],
      ownerId: creator.id || 'default-user',
      ownerEmail: creator.email || 'demo@complspec.kz',
      members: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.projects[id] = newProject;
    this.data.items[id] = [];
    this.save();

    return { project: newProject, items: [] };
  }

  public updateProject(projectId: string, updates: Partial<ProjectRecord>): ProjectRecord | null {
    const project = this.data.projects[projectId];
    if (!project) return null;

    const currentVer = project.version || 1;
    Object.assign(project, updates, {
      updatedAt: new Date().toISOString(),
      version: currentVer + 1,
      currency: '₸', // Always in Tenge
    });

    this.save();
    return project;
  }

  public deleteProject(projectId: string): boolean {
    if (!this.data.projects[projectId]) return false;
    delete this.data.projects[projectId];
    delete this.data.items[projectId];
    this.save();
    return true;
  }

  // --- Items ---
  public getItems(projectId: string): any[] {
    return this.data.items[projectId] || [];
  }

  public syncProjectAndItems(
    projectId: string,
    projectUpdates?: Partial<ProjectRecord>,
    items?: any[]
  ): { success: boolean; updatedAt: string; version: number; itemsCount: number } {
    const now = new Date().toISOString();

    if (!this.data.projects[projectId]) {
      this.data.projects[projectId] = {
        id: projectId,
        name: projectUpdates?.name || 'Проект',
        client: projectUpdates?.client || '',
        address: projectUpdates?.address || '',
        area: Number(projectUpdates?.area) || 0,
        totalBudget: Number(projectUpdates?.totalBudget) || 0,
        currency: '₸',
        description: projectUpdates?.description || '',
        rooms: projectUpdates?.rooms || [],
        categories: projectUpdates?.categories || [],
        ownerId: projectUpdates?.ownerId || 'default-user',
        ownerEmail: projectUpdates?.ownerEmail || 'demo@complspec.kz',
        members: projectUpdates?.members || [],
        status: projectUpdates?.status || 'active',
        createdAt: now,
        updatedAt: now,
        version: 1,
        ...projectUpdates,
      };
    } else {
      const currentVer = this.data.projects[projectId].version || 1;
      if (projectUpdates) {
        // Protect members, ownerId, and ownerEmail from accidental overwrite by client item updates
        const { members, ownerId, ownerEmail, ...safeUpdates } = projectUpdates;
        Object.assign(this.data.projects[projectId], safeUpdates);
      }
      this.data.projects[projectId].updatedAt = now;
      this.data.projects[projectId].version = currentVer + 1;
    }

    if (Array.isArray(items)) {
      this.data.items[projectId] = items.map((it) => ({
        ...it,
        projectId,
      }));
    }

    this.save();
    const proj = this.data.projects[projectId];
    return {
      success: true,
      updatedAt: proj.updatedAt,
      version: proj.version || 1,
      itemsCount: (this.data.items[projectId] || []).length,
    };
  }

  // --- Invitations & Collaboration ---
  public inviteMember(
    projectId: string,
    inviterEmail: string,
    email: string,
    role: 'team' | 'client' | 'contractor'
  ): { success: boolean; member?: ProjectMember; error?: string } {
    const project = this.data.projects[projectId];
    if (!project) return { success: false, error: 'Проект не найден' };

    const cleanEmail = email.trim().toLowerCase();
    if (!project.members) project.members = [];

    const existingMember = project.members.find((m) => m.email.toLowerCase() === cleanEmail);
    if (existingMember) {
      existingMember.role = role;
      existingMember.status = 'active';
      project.updatedAt = new Date().toISOString();
      project.version = (project.version || 1) + 1;
      this.save();
      return { success: true, member: existingMember };
    }

    const newMember: ProjectMember = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      email: cleanEmail,
      role,
      status: 'active',
      invitedAt: new Date().toISOString(),
    };

    project.members.push(newMember);
    project.updatedAt = new Date().toISOString();
    project.version = (project.version || 1) + 1;

    const invId = `inv-${Date.now()}`;
    this.data.invitations[invId] = {
      id: invId,
      projectId,
      projectName: project.name,
      inviterEmail,
      email: cleanEmail,
      role,
      token: `tok-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.save();
    return { success: true, member: newMember };
  }

  public removeMember(projectId: string, email: string): boolean {
    const project = this.data.projects[projectId];
    if (!project || !project.members) return false;

    const cleanEmail = email.trim().toLowerCase();
    project.members = project.members.filter((m) => m.email.toLowerCase() !== cleanEmail);
    project.updatedAt = new Date().toISOString();
    project.version = (project.version || 1) + 1;
    this.save();
    return true;
  }

  private resolveInvitationsForUser(email: string, name?: string) {
    const cleanEmail = email.trim().toLowerCase();
    Object.values(this.data.invitations).forEach((inv) => {
      if (inv.email.toLowerCase() === cleanEmail && inv.status === 'pending') {
        inv.status = 'accepted';
        const project = this.data.projects[inv.projectId];
        if (project && project.members) {
          const m = project.members.find((mem) => mem.email.toLowerCase() === cleanEmail);
          if (m) {
            m.status = 'active';
            m.acceptedAt = new Date().toISOString();
            if (name) m.name = name;
          }
        }
      }
    });
  }

  // --- Sessions ---
  public createSession(email: string, role: 'team' | 'client' | 'contractor', isAdmin: boolean, projectId?: string): string {
    const token = crypto.randomUUID() + '-' + Date.now().toString(36);
    this.data.sessions[token] = {
      token,
      email: email.toLowerCase().trim(),
      role,
      isAdmin,
      projectId,
      createdAt: new Date().toISOString(),
    };
    this.save();
    return token;
  }

  public getSession(token: string): SessionData | null {
    return this.data.sessions[token] || null;
  }

  public deleteSession(token: string): void {
    delete this.data.sessions[token];
    this.save();
  }

  // --- Access Requests ---
  public createAccessRequest(projectId: string, email: string): { success: boolean; request?: AccessRequestRecord; error?: string } {
    const project = this.data.projects[projectId];
    if (!project) return { success: false, error: 'Проект не найден' };

    const cleanEmail = email.trim().toLowerCase();

    // Already a member?
    if (project.members?.some((m) => m.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'already_member' };
    }

    // Already pending?
    if (!this.data.accessRequests[projectId]) this.data.accessRequests[projectId] = [];
    const existing = this.data.accessRequests[projectId].find(
      (r) => r.email.toLowerCase() === cleanEmail && r.status === 'pending'
    );
    if (existing) {
      return { success: false, error: 'already_requested' };
    }

    const request: AccessRequestRecord = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId,
      email: cleanEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.accessRequests[projectId].push(request);
    this.save();
    return { success: true, request };
  }

  public getAccessRequests(projectId: string): AccessRequestRecord[] {
    return (this.data.accessRequests[projectId] || []).filter((r) => r.status === 'pending');
  }

  public approveAccessRequest(projectId: string, requestId: string, role: 'team' | 'client' | 'contractor'): { success: boolean; error?: string } {
    const requests = this.data.accessRequests[projectId];
    if (!requests) return { success: false, error: 'Заявки не найдены' };

    const request = requests.find((r) => r.id === requestId);
    if (!request) return { success: false, error: 'Заявка не найдена' };

    request.status = 'approved';
    request.role = role;
    request.resolvedAt = new Date().toISOString();

    // Add email to project members
    const project = this.data.projects[projectId];
    if (project) {
      if (!project.members) project.members = [];
      const existing = project.members.find((m) => m.email.toLowerCase() === request.email.toLowerCase());
      if (existing) {
        existing.role = role;
        existing.status = 'active';
      } else {
        project.members.push({
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          email: request.email,
          role,
          status: 'active',
          invitedAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
        });
      }
      project.updatedAt = new Date().toISOString();
      project.version = (project.version || 1) + 1;
    }

    this.save();
    return { success: true };
  }

  public rejectAccessRequest(projectId: string, requestId: string): { success: boolean; error?: string } {
    const requests = this.data.accessRequests[projectId];
    if (!requests) return { success: false, error: 'Заявки не найдены' };

    const request = requests.find((r) => r.id === requestId);
    if (!request) return { success: false, error: 'Заявка не найдена' };

    request.status = 'rejected';
    request.resolvedAt = new Date().toISOString();
    this.save();
    return { success: true };
  }
}

export const db = new DatabaseManager();
