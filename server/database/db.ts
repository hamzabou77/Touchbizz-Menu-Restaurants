import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Types
export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'owner';
  created_at: string;
  updated_at: string;
}

export interface DbRestaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  currency: string;
  logo_url: string;
  cover_url: string;
  theme: 'modern' | 'luxury' | 'moroccan' | 'minimal';
  primary_color: string;
  languages: string; // JSON string in MySQL or array
  default_language: string;
  is_published: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  restaurant_id: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface DbMenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  price: number;
  image_url: string;
  is_available: number;
  badge: string;
  ingredients: string;
  allergens: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface StorageData {
  users: DbUser[];
  restaurants: DbRestaurant[];
  categories: DbCategory[];
  menu_items: DbMenuItem[];
}

const DATA_FILE_PATH = path.join(process.cwd(), 'server', 'database', 'touchbizz-data.json');

let mysqlPool: mysql.Pool | null = null;
let isUsingMysql = false;

// Initialize MySQL pool if configured
export async function initDatabase(): Promise<void> {
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME || 'touchbizz_menu';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  if (dbHost && dbUser && dbHost !== 'none' && dbHost !== 'localhost_disabled') {
    try {
      const pool = mysql.createPool({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 4000,
      });

      // Test connection
      const connection = await pool.getConnection();
      console.log(`[DB] Successfully connected to MySQL at ${dbHost}:${dbPort}/${dbName}`);
      connection.release();
      mysqlPool = pool;
      isUsingMysql = true;

      // Auto-create tables if they don't exist
      await initMysqlTables(pool);
      return;
    } catch (err) {
      console.warn(`[DB] MySQL connection failed or not available (${(err as Error).message}). Falling back to persistent file storage engine.`);
    }
  }

  // Ensure persistent data directory & file exist with initial realistic seed data
  ensureJsonDataStore();
  console.log(`[DB] Storage engine initialized with persistent file storage at: ${DATA_FILE_PATH}`);
}

async function initMysqlTables(pool: mysql.Pool) {
  const schemaPath = path.join(process.cwd(), 'server', 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    try {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--') && !s.toUpperCase().startsWith('USE') && !s.toUpperCase().startsWith('CREATE DATABASE'));
      
      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log('[DB] MySQL schema tables verified/created.');
    } catch (e) {
      console.error('[DB] Error verifying MySQL tables:', (e as Error).message);
    }
  }
}

// Fallback JSON-file persistent storage implementation
function getJsonData(): StorageData {
  ensureJsonDataStore();
  try {
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading json data file:', err);
    return { users: [], restaurants: [], categories: [], menu_items: [] };
  }
}

function saveJsonData(data: StorageData): void {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving json data file:', err);
  }
}

function ensureJsonDataStore(): void {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE_PATH)) {
    // Generate default admin and authentic sample restaurant: "La Table Marrakech"
    const now = new Date().toISOString();
    const adminPasswordHash = bcrypt.hashSync('Hamza0620799395', 10);
    const adminUser: DbUser = {
      id: 'usr_admin_touchbizz_1',
      email: 'boalyhamza@gmail.com',
      password_hash: adminPasswordHash,
      name: 'Hamza Boaly',
      role: 'admin',
      created_at: now,
      updated_at: now,
    };

    const restaurant1: DbRestaurant = {
      id: 'rst_la_table_marrakech',
      user_id: adminUser.id,
      name: 'La Table Marrakech',
      slug: 'la-table-marrakech',
      description: 'Gastronomie marocaine raffinée et saveurs méditerranéennes au cœur de Guéliz.',
      address: 'Avenue Mohammed V, Guéliz, Marrakech',
      phone: '+212 5 24 43 21 00',
      currency: 'MAD',
      logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80',
      theme: 'moroccan',
      primary_color: '#b45309',
      languages: JSON.stringify(['fr', 'ar', 'en']),
      default_language: 'fr',
      is_published: 1,
      created_at: now,
      updated_at: now,
    };

    const categories: DbCategory[] = [
      {
        id: 'cat_entrees',
        restaurant_id: restaurant1.id,
        name_fr: 'Entrées & Salades',
        name_ar: 'المقبلات والسلطات',
        name_en: 'Starters & Salads',
        sort_order: 1,
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_tajines',
        restaurant_id: restaurant1.id,
        name_fr: 'Tajines Traditionnels',
        name_ar: 'طواجن تقليدية',
        name_en: 'Traditional Tagines',
        sort_order: 2,
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_couscous',
        restaurant_id: restaurant1.id,
        name_fr: 'Couscous Royal & Spécialités',
        name_ar: 'كسكس ملكي ومختارات',
        name_en: 'Royal Couscous & Specialties',
        sort_order: 3,
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_desserts',
        restaurant_id: restaurant1.id,
        name_fr: 'Desserts Gourmands',
        name_ar: 'حلويات مغربية',
        name_en: 'Gourmet Desserts',
        sort_order: 4,
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cat_boissons',
        restaurant_id: restaurant1.id,
        name_fr: 'Boissons & Thés',
        name_ar: 'مشروبات وشاي مغربي',
        name_en: 'Beverages & Teas',
        sort_order: 5,
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    ];

    const menuItems: DbMenuItem[] = [
      // Entrées
      {
        id: 'item_1',
        restaurant_id: restaurant1.id,
        category_id: 'cat_entrees',
        name_fr: 'Zaalouk d’Aubergines Fumé & Huile d’Argan',
        name_ar: 'زعلوك الباذنجان المدخن بزيت أركان',
        name_en: 'Smoked Eggplant Zaalouk with Argan Oil',
        description_fr: 'Caviar d’aubergines grillées au feu de bois, tomates confites, cumin sauvage et filet d’huile d’argan de Souss.',
        description_ar: 'باذنجان مشوي على الفحم مع طماطم معسلة وكمون بلدي ورشة من زيت أركان الصافي.',
        description_en: 'Charcoal-grilled eggplant caviar, confit tomatoes, wild cumin and organic Souss argan oil.',
        price: 65,
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Populaire',
        ingredients: 'Aubergines, Tomates, Ail, Cumin, Huile d\'argan, Persil',
        allergens: 'Aucun',
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_2',
        restaurant_id: restaurant1.id,
        category_id: 'cat_entrees',
        name_fr: 'Pastilla Croquante au Poulet et Amandes',
        name_ar: 'بسطيلة الدجاج واللوز المقرمشة',
        name_en: 'Crispy Chicken & Roasted Almond Pastilla',
        description_fr: 'Feuilleté traditionnel marocain croustillant farci au poulet fermier effiloché, amandes torréfiées à la cannelle et fleur d’oranger.',
        description_ar: 'ورقة بسطيلة مقرمشة محشوة بالدجاج البلدي واللوز المحمص والقرفة وماء الزهر الفواح.',
        description_en: 'Crispy Moroccan filo pastry stuffed with shredded farm chicken, roasted cinnamon almonds and orange blossom essence.',
        price: 95,
        image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Chef',
        ingredients: 'Poulet fermier, Pâte filo, Amandes, Cannelle, Œufs, Eau de fleur d\'oranger',
        allergens: 'Fruits à coque (amandes), Œufs, Gluten',
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_3',
        restaurant_id: restaurant1.id,
        category_id: 'cat_entrees',
        name_fr: 'Briouates Assorties (Fromage & Épinards, Bœuf)',
        name_ar: 'تشكيلة بريوات (جبن وسبانخ، لحم مفروم)',
        name_en: 'Assorted Moroccan Briouates Pastries',
        description_fr: 'Trio de triangles dorés : fromage de chèvre frais aux herbes de l\'Atlas, et viande hachée aux épices douces.',
        description_ar: 'ثلاثي مقرمش من الجبن الطازج مع أعشاب الأطلس واللحم المفروم المتبل.',
        description_en: 'Golden triangular filo pastries filled with fresh Atlas goat cheese and spiced minced beef.',
        price: 80,
        image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: '',
        ingredients: 'Feuilles de pastilla, Viande hachée, Fromage frais, Épinards, Épices',
        allergens: 'Lait, Gluten',
        sort_order: 3,
        created_at: now,
        updated_at: now,
      },
      // Tajines
      {
        id: 'item_4',
        restaurant_id: restaurant1.id,
        category_id: 'cat_tajines',
        name_fr: 'Tajine d’Agneau aux Pruneaux Confits et Amandes',
        name_ar: 'طاجين لحم الخروف بالبرقوق المعسل واللوز',
        name_en: 'Lamb Tagine with Confit Prunes & Toasted Almonds',
        description_fr: 'Souris d’agneau fondante cuite 5 heures à feu doux, sauce onctueuse au safran de Taliouine, pruneaux caramélisés et graines de sésame.',
        description_ar: 'لحم خروف طري مطهو ببطء مع زعفران تالوين، برقوق معسل بالكراميل ولوز محمص مقرمش.',
        description_en: 'Slow-cooked lamb shank with Taliouine saffron reduction, caramelized prunes and toasted sesame almonds.',
        price: 160,
        image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Populaire',
        ingredients: 'Agneau de terroir, Pruneaux, Amandes, Safran pur, Miel d\'oranger, Cannelle',
        allergens: 'Fruits à coque (amandes), Sésame',
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_5',
        restaurant_id: restaurant1.id,
        category_id: 'cat_tajines',
        name_fr: 'Tajine de Poulet Fermier au Citron Confit & Olives Meslalla',
        name_ar: 'طاجين دجاج بلدي بالحامض المصير والزيتون',
        name_en: 'Farm Chicken Tagine with Preserved Lemon & Meslalla Olives',
        description_fr: 'Cuisses de poulet fermier marinées au gingembre frais et coriandre, citrons beldi confits et olives violettes cassées.',
        description_ar: 'دجاج متبل بالزنجبيل والكزبرة، ليمون مخلل بلدي وزيتون مسلالة أصيل.',
        description_en: 'Free-range chicken thighs marinated in ginger and coriander, slow-cooked with preserved lemons and purple olives.',
        price: 140,
        image_url: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: '',
        ingredients: 'Poulet fermier, Citron confit, Olives meslalla, Gingembre, Curcuma',
        allergens: 'Aucun',
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_6',
        restaurant_id: restaurant1.id,
        category_id: 'cat_tajines',
        name_fr: 'Tajine de Kefta aux Œufs Bio & Sauce Tomate Épicée',
        name_ar: 'طاجين الكفتة بالبيض البلدي وصلصة الطماطم الحارة',
        name_en: 'Beef Kefta Tagine with Organic Poached Eggs & Spicy Tomato Sauce',
        description_fr: 'Boulettes de bœuf haché assaisonnées au cumin et paprika fumé, réduction de tomates fraîches et œufs pochés à cœur coulant.',
        description_ar: 'كرات لحم البقر المتبل بالكامون والفلفل الحلو مع صلصة طماطم طازجة وبيض بلدي شهي.',
        description_en: 'Minced beef meatballs simmered in herb tomato sauce, topped with runny organic poached eggs.',
        price: 125,
        image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Épicé',
        ingredients: 'Viande de bœuf hachée, Sauce tomate, Œufs, Piment doux, Cumin, Persil',
        allergens: 'Œufs',
        sort_order: 3,
        created_at: now,
        updated_at: now,
      },
      // Couscous
      {
        id: 'item_7',
        restaurant_id: restaurant1.id,
        category_id: 'cat_couscous',
        name_fr: 'Couscous Royal aux Sept Légumes et Tfaya',
        name_ar: 'كسكس ملكي بسبع خضار والتفاية الحلوة',
        name_en: 'Royal Couscous with Seven Vegetables & Tfaya',
        description_fr: 'Semoule fine cuite à la vapeur 3 fois, agneau tendre, poulet fermier, merguez artisanale, 7 légumes du potager et oignons confits aux raisins secs (Tfaya).',
        description_ar: 'سميد بلدي مفور بعناية، مع لحم الخروف والدجاج والمرقاز البلدي، وسبع خضار مع تفاية البصل والزبيب.',
        description_en: 'Fine steamed semolina served with tender lamb, chicken, artisan merguez, garden vegetables and caramelized sweet onion tfaya.',
        price: 185,
        image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Chef',
        ingredients: 'Semoule de blé, Agneau, Poulet, Merguez, Courgettes, Carottes, Navets, Pois chiches, Oignons caramélisés',
        allergens: 'Gluten',
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      // Desserts
      {
        id: 'item_8',
        restaurant_id: restaurant1.id,
        category_id: 'cat_desserts',
        name_fr: 'Pastilla Croustillante au Lait et Fleur d’Oranger (Ktéfa)',
        name_ar: 'بسطيلة الحليب وجوهرة بماء الزهر',
        name_en: 'Crispy Milk Pastilla with Orange Blossom (Jawhara)',
        description_fr: 'Feuilles de ouarka croustillantes alternées d\'une crème onctueuse parfumée à la fleur d’oranger et amandes pilées.',
        description_ar: 'طبقات مقرمشة مع كريمة الحليب الفاخرة المنسوجة برائحة ماء الزهر ورقائق اللوز.',
        description_en: 'Crispy layered pastry sheets with delicate orange blossom milk custard and crushed toasted almonds.',
        price: 60,
        image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Populaire',
        ingredients: 'Feuilles ouarka, Lait, Amidon, Eau de fleur d\'oranger, Amandes',
        allergens: 'Lait, Fruits à coque, Gluten',
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_9',
        restaurant_id: restaurant1.id,
        category_id: 'cat_desserts',
        name_fr: 'Salade d’Oranges à la Cannelle & Dattes Majhoul',
        name_ar: 'سلطة البرتقال بالقرفة وتمر المجهول',
        name_en: 'Cinnamon Orange Carpaccio with Majhoul Dates',
        description_fr: 'Fines tranches d’oranges fraîches du verger, sirop léger à la fleur d’oranger, cannelle de Ceylan et dattes Majhoul royales.',
        description_ar: 'شرائح برتقال طازجة مع قرفة سيلان وماء زهر وتمر المجهول الفاخر.',
        description_en: 'Fresh orange slices dusted with Ceylon cinnamon, orange blossom reduction and sweet royal Majhoul dates.',
        price: 50,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Nouveau',
        ingredients: 'Oranges fraîches, Cannelle, Dattes Majhoul, Menthe',
        allergens: 'Aucun',
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
      // Boissons
      {
        id: 'item_10',
        restaurant_id: restaurant1.id,
        category_id: 'cat_boissons',
        name_fr: 'Thé Traditionnel à la Menthe Fraîche de l\'Ourika',
        name_ar: 'أتاي مغربي أصيل بنعناع أوريكا المنعش',
        name_en: 'Traditional Moroccan Mint Tea from Ourika',
        description_fr: 'Thé vert Gunpowder infusé à la menthe fraîche parfumée, servi traditionnellement en théière argentée.',
        description_ar: 'شاي أخضر صيني مفوح بالنعناع العبق من وادي أوريكا يقدم في براد تقليدي.',
        description_en: 'Authentic Moroccan Gunpowder green tea brewed with fresh mountain mint, traditionally served.',
        price: 35,
        image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: 'Populaire',
        ingredients: 'Thé vert gunpowder, Menthe fraîche, Sucre',
        allergens: 'Aucun',
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'item_11',
        restaurant_id: restaurant1.id,
        category_id: 'cat_boissons',
        name_fr: 'Jus d’Amandes Frais à la Fleur d’Oranger',
        name_ar: 'عصير اللوز الطازج بماء الزهر والحليب',
        name_en: 'Fresh Almond Milk with Orange Blossom',
        description_fr: 'Boisson rafraîchissante onctueuse à base d’amandes fraîches blanchies, lait entier et eau de fleur d’oranger distillée.',
        description_ar: 'مشروب منعش محضّر من اللوز البلدي المقشر والحليب الصافي مع ماء الزهر الطبيعي.',
        description_en: 'Silky smooth beverage made with freshly ground sweet almonds, whole milk and pure orange blossom essence.',
        price: 45,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
        is_available: 1,
        badge: '',
        ingredients: 'Amandes, Lait, Sucre de canne, Fleur d\'oranger',
        allergens: 'Lait, Fruits à coque (amandes)',
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
    ];

    const initialData: StorageData = {
      users: [adminUser],
      restaurants: [restaurant1],
      categories,
      menu_items: menuItems,
    };

    saveJsonData(initialData);
  } else {
    try {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const data: StorageData = JSON.parse(raw);
      let updated = false;
      data.users = (data.users || []).map((u) => {
        if (u.id === 'usr_admin_touchbizz_1' || u.email === 'admin@touchbizz.ma' || u.email === 'boalyhamza@gmail.com') {
          if (u.email !== 'boalyhamza@gmail.com' || u.name !== 'Hamza Boaly') {
            updated = true;
          }
          return {
            ...u,
            email: 'boalyhamza@gmail.com',
            name: 'Hamza Boaly',
            password_hash: bcrypt.hashSync('Hamza0620799395', 10),
            updated_at: new Date().toISOString(),
          };
        }
        return u;
      });
      if (updated) {
        saveJsonData(data);
      }
    } catch {}
  }
}

// ----------------------------------------------------
// UNIFIED DB REPOSITORY WITH TRUE RELATIONAL INTERFACE
// ----------------------------------------------------

export const db = {
  isUsingMysql: () => isUsingMysql,

  // USERS
  async getUserByEmail(email: string): Promise<DbUser | null> {
    if (isUsingMysql && mysqlPool) {
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      return (rows[0] as DbUser) || null;
    }
    const data = getJsonData();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getUserById(id: string): Promise<DbUser | null> {
    if (isUsingMysql && mysqlPool) {
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      return (rows[0] as DbUser) || null;
    }
    const data = getJsonData();
    return data.users.find((u) => u.id === id) || null;
  },

  async createUser(user: DbUser): Promise<DbUser> {
    if (isUsingMysql && mysqlPool) {
      await mysqlPool.execute(
        'INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.password_hash, user.name, user.role, user.created_at, user.updated_at]
      );
      return user;
    }
    const data = getJsonData();
    data.users.push(user);
    saveJsonData(data);
    return user;
  },

  // RESTAURANTS
  async getRestaurants(userId?: string): Promise<DbRestaurant[]> {
    if (isUsingMysql && mysqlPool) {
      if (userId) {
        const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM restaurants WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows as DbRestaurant[];
      }
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM restaurants ORDER BY created_at DESC');
      return rows as DbRestaurant[];
    }
    const data = getJsonData();
    if (userId) {
      return data.restaurants.filter((r) => r.user_id === userId);
    }
    return data.restaurants;
  },

  async getRestaurantById(id: string): Promise<DbRestaurant | null> {
    if (isUsingMysql && mysqlPool) {
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM restaurants WHERE id = ? LIMIT 1', [id]);
      return (rows[0] as DbRestaurant) || null;
    }
    const data = getJsonData();
    return data.restaurants.find((r) => r.id === id) || null;
  },

  async getRestaurantBySlug(slug: string): Promise<DbRestaurant | null> {
    if (isUsingMysql && mysqlPool) {
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM restaurants WHERE slug = ? LIMIT 1', [slug]);
      return (rows[0] as DbRestaurant) || null;
    }
    const data = getJsonData();
    return data.restaurants.find((r) => r.slug === slug) || null;
  },

  async createRestaurant(rest: DbRestaurant): Promise<DbRestaurant> {
    if (isUsingMysql && mysqlPool) {
      await mysqlPool.execute(
        `INSERT INTO restaurants (id, user_id, name, slug, description, address, phone, currency, logo_url, cover_url, theme, primary_color, languages, default_language, is_published, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rest.id,
          rest.user_id,
          rest.name,
          rest.slug,
          rest.description,
          rest.address,
          rest.phone,
          rest.currency,
          rest.logo_url,
          rest.cover_url,
          rest.theme,
          rest.primary_color,
          typeof rest.languages === 'string' ? rest.languages : JSON.stringify(rest.languages),
          rest.default_language,
          rest.is_published,
          rest.created_at,
          rest.updated_at,
        ]
      );
      return rest;
    }
    const data = getJsonData();
    data.restaurants.push(rest);
    saveJsonData(data);
    return rest;
  },

  async updateRestaurant(id: string, updates: Partial<DbRestaurant>): Promise<DbRestaurant | null> {
    if (isUsingMysql && mysqlPool) {
      const keys = Object.keys(updates).filter((k) => k !== 'id');
      if (keys.length === 0) return this.getRestaurantById(id);
      
      const setClauses = keys.map((k) => `\`${k}\` = ?`).join(', ');
      const values = keys.map((k) => {
        const val = (updates as any)[k];
        if (k === 'languages' && typeof val !== 'string') {
          return JSON.stringify(val);
        }
        return val;
      });
      values.push(id);

      await mysqlPool.execute(`UPDATE restaurants SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
      return this.getRestaurantById(id);
    }

    const data = getJsonData();
    const index = data.restaurants.findIndex((r) => r.id === id);
    if (index === -1) return null;
    data.restaurants[index] = {
      ...data.restaurants[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveJsonData(data);
    return data.restaurants[index];
  },

  async deleteRestaurant(id: string): Promise<boolean> {
    if (isUsingMysql && mysqlPool) {
      const [res] = await mysqlPool.execute<mysql.ResultSetHeader>('DELETE FROM restaurants WHERE id = ?', [id]);
      return res.affectedRows > 0;
    }
    const data = getJsonData();
    data.restaurants = data.restaurants.filter((r) => r.id !== id);
    data.categories = data.categories.filter((c) => c.restaurant_id !== id);
    data.menu_items = data.menu_items.filter((m) => m.restaurant_id !== id);
    saveJsonData(data);
    return true;
  },

  // CATEGORIES
  async getCategories(restaurantId: string): Promise<DbCategory[]> {
    if (isUsingMysql && mysqlPool) {
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC, created_at ASC',
        [restaurantId]
      );
      return rows as DbCategory[];
    }
    const data = getJsonData();
    return data.categories
      .filter((c) => c.restaurant_id === restaurantId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async getCategoryById(id: string): Promise<DbCategory | null> {
    if (isUsingMysql && mysqlPool) {
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
      return (rows[0] as DbCategory) || null;
    }
    const data = getJsonData();
    return data.categories.find((c) => c.id === id) || null;
  },

  async createCategory(category: DbCategory): Promise<DbCategory> {
    if (isUsingMysql && mysqlPool) {
      await mysqlPool.execute(
        `INSERT INTO categories (id, restaurant_id, name_fr, name_ar, name_en, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category.id,
          category.restaurant_id,
          category.name_fr,
          category.name_ar || '',
          category.name_en || '',
          category.sort_order,
          category.is_active,
          category.created_at,
          category.updated_at,
        ]
      );
      return category;
    }
    const data = getJsonData();
    data.categories.push(category);
    saveJsonData(data);
    return category;
  },

  async updateCategory(id: string, updates: Partial<DbCategory>): Promise<DbCategory | null> {
    if (isUsingMysql && mysqlPool) {
      const keys = Object.keys(updates).filter((k) => k !== 'id');
      if (keys.length === 0) return this.getCategoryById(id);
      const setClauses = keys.map((k) => `\`${k}\` = ?`).join(', ');
      const values = keys.map((k) => (updates as any)[k]);
      values.push(id);
      await mysqlPool.execute(`UPDATE categories SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
      return this.getCategoryById(id);
    }
    const data = getJsonData();
    const index = data.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    data.categories[index] = {
      ...data.categories[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveJsonData(data);
    return data.categories[index];
  },

  async reorderCategories(restaurantId: string, orderedIds: string[]): Promise<void> {
    if (isUsingMysql && mysqlPool) {
      for (let i = 0; i < orderedIds.length; i++) {
        await mysqlPool.execute('UPDATE categories SET sort_order = ? WHERE id = ? AND restaurant_id = ?', [
          i + 1,
          orderedIds[i],
          restaurantId,
        ]);
      }
      return;
    }
    const data = getJsonData();
    orderedIds.forEach((id, index) => {
      const cat = data.categories.find((c) => c.id === id && c.restaurant_id === restaurantId);
      if (cat) cat.sort_order = index + 1;
    });
    saveJsonData(data);
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isUsingMysql && mysqlPool) {
      const [res] = await mysqlPool.execute<mysql.ResultSetHeader>('DELETE FROM categories WHERE id = ?', [id]);
      return res.affectedRows > 0;
    }
    const data = getJsonData();
    data.categories = data.categories.filter((c) => c.id !== id);
    data.menu_items = data.menu_items.filter((m) => m.category_id !== id);
    saveJsonData(data);
    return true;
  },

  // MENU ITEMS
  async getMenuItems(restaurantId: string, categoryId?: string): Promise<DbMenuItem[]> {
    if (isUsingMysql && mysqlPool) {
      if (categoryId) {
        const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>(
          'SELECT * FROM menu_items WHERE restaurant_id = ? AND category_id = ? ORDER BY sort_order ASC, created_at ASC',
          [restaurantId, categoryId]
        );
        return rows as DbMenuItem[];
      }
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort_order ASC, created_at ASC',
        [restaurantId]
      );
      return rows as DbMenuItem[];
    }
    const data = getJsonData();
    let items = data.menu_items.filter((m) => m.restaurant_id === restaurantId);
    if (categoryId) {
      items = items.filter((m) => m.category_id === categoryId);
    }
    return items.sort((a, b) => a.sort_order - b.sort_order);
  },

  async getMenuItemById(id: string): Promise<DbMenuItem | null> {
    if (isUsingMysql && mysqlPool) {
      const [rows] = await mysqlPool.execute<mysql.RowDataPacket[]>('SELECT * FROM menu_items WHERE id = ? LIMIT 1', [id]);
      return (rows[0] as DbMenuItem) || null;
    }
    const data = getJsonData();
    return data.menu_items.find((m) => m.id === id) || null;
  },

  async createMenuItem(item: DbMenuItem): Promise<DbMenuItem> {
    if (isUsingMysql && mysqlPool) {
      await mysqlPool.execute(
        `INSERT INTO menu_items (id, restaurant_id, category_id, name_fr, name_ar, name_en, description_fr, description_ar, description_en, price, image_url, is_available, badge, ingredients, allergens, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.restaurant_id,
          item.category_id,
          item.name_fr,
          item.name_ar || '',
          item.name_en || '',
          item.description_fr || '',
          item.description_ar || '',
          item.description_en || '',
          item.price,
          item.image_url || '',
          item.is_available,
          item.badge || '',
          item.ingredients || '',
          item.allergens || '',
          item.sort_order,
          item.created_at,
          item.updated_at,
        ]
      );
      return item;
    }
    const data = getJsonData();
    data.menu_items.push(item);
    saveJsonData(data);
    return item;
  },

  async updateMenuItem(id: string, updates: Partial<DbMenuItem>): Promise<DbMenuItem | null> {
    if (isUsingMysql && mysqlPool) {
      const keys = Object.keys(updates).filter((k) => k !== 'id');
      if (keys.length === 0) return this.getMenuItemById(id);
      const setClauses = keys.map((k) => `\`${k}\` = ?`).join(', ');
      const values = keys.map((k) => (updates as any)[k]);
      values.push(id);
      await mysqlPool.execute(`UPDATE menu_items SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
      return this.getMenuItemById(id);
    }
    const data = getJsonData();
    const index = data.menu_items.findIndex((m) => m.id === id);
    if (index === -1) return null;
    data.menu_items[index] = {
      ...data.menu_items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveJsonData(data);
    return data.menu_items[index];
  },

  async reorderMenuItems(restaurantId: string, orderedIds: string[]): Promise<void> {
    if (isUsingMysql && mysqlPool) {
      for (let i = 0; i < orderedIds.length; i++) {
        await mysqlPool.execute('UPDATE menu_items SET sort_order = ? WHERE id = ? AND restaurant_id = ?', [
          i + 1,
          orderedIds[i],
          restaurantId,
        ]);
      }
      return;
    }
    const data = getJsonData();
    orderedIds.forEach((id, index) => {
      const item = data.menu_items.find((m) => m.id === id && m.restaurant_id === restaurantId);
      if (item) item.sort_order = index + 1;
    });
    saveJsonData(data);
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    if (isUsingMysql && mysqlPool) {
      const [res] = await mysqlPool.execute<mysql.ResultSetHeader>('DELETE FROM menu_items WHERE id = ?', [id]);
      return res.affectedRows > 0;
    }
    const data = getJsonData();
    data.menu_items = data.menu_items.filter((m) => m.id !== id);
    saveJsonData(data);
    return true;
  },
};
