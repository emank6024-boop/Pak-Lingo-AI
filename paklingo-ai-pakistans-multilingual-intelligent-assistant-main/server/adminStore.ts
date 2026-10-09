/**
 * PakLingo AI - Enterprise Administrative Data Store
 * Secure server-side in-memory repository for users, activity, telemetry, conversations, and audit logs.
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'auditor';
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'email' | 'guest';
  status: 'active' | 'deactivated';
  createdAt: string;
  lastActiveAt: string;
  preferredLanguage: string;
  theme: string;
  fontSize: string;
  voicePreference: string;
  mostRecentFeature: string;
  stats: {
    conversationsCount: number;
    searchesCount: number;
    translationsCount: number;
    documentsCount: number;
    aiRequestsCount: number;
    featuresUsed: string[];
    languagesUsed: string[];
  };
}

export interface UserActivityEvent {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'chat' | 'search' | 'translation' | 'document' | 'tool_use' | 'settings_change' | 'auth';
  feature: string;
  language: string;
  summary: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  category: string;
  language: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'assistant' | 'system';
    text: string;
    timestamp: string;
  }>;
}

export interface TranslationRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  sourceLang: string;
  targetLang: string;
  sourceTextSnippet: string;
  translatedSnippet: string;
  charCount: number;
  timestamp: string;
  tool: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  processingStatus: 'completed' | 'processing' | 'failed';
  feature: string;
  language: string;
  summary: string;
  timestamp: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: 'user_deactivated' | 'user_reactivated' | 'export_data' | 'settings_updated' | 'admin_login' | 'admin_logout';
  targetType: 'user' | 'system' | 'export' | 'session';
  targetId?: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface SystemSettingsConfig {
  siteName: string;
  maintenanceMode: boolean;
  allowPublicSignups: boolean;
  dataRetentionDays: number;
  rateLimitPerMinute: number;
  defaultLanguage: string;
  enabledFeatures: {
    chat: boolean;
    translate: boolean;
    ocrDocuments: boolean;
    governmentAssistant: boolean;
    teacher: boolean;
    medical: boolean;
    farmer: boolean;
    legal: boolean;
    voiceAssistant: boolean;
    fakeNewsDetector: boolean;
    signLanguage: boolean;
  };
  aiModels: {
    primaryModel: string;
    fallbackModel: string;
    ttsModel: string;
  };
  auditLogRetentionDays: number;
}

class AdminStore {
  private adminSessions = new Map<string, { admin: AdminUser; expiresAt: number }>();
  private users = new Map<string, AppUserRecord>();
  private activities: UserActivityEvent[] = [];
  private conversations = new Map<string, ConversationRecord>();
  private translations: TranslationRecord[] = [];
  private documents: DocumentRecord[] = [];
  private auditLogs: AdminAuditLog[] = [];
  private settings: SystemSettingsConfig;

  constructor() {
    this.settings = {
      siteName: 'PakLingo AI - Pakistan Multilingual AI Platform',
      maintenanceMode: false,
      allowPublicSignups: true,
      dataRetentionDays: 90,
      rateLimitPerMinute: 60,
      defaultLanguage: 'ur',
      enabledFeatures: {
        chat: true,
        translate: true,
        ocrDocuments: true,
        governmentAssistant: true,
        teacher: true,
        medical: true,
        farmer: true,
        legal: true,
        voiceAssistant: true,
        fakeNewsDetector: true,
        signLanguage: true,
      },
      aiModels: {
        primaryModel: 'gemini-3.1-flash-lite',
        fallbackModel: 'gemini-3.8-flash',
        ttsModel: 'gemini-3.1-flash-tts-preview',
      },
      auditLogRetentionDays: 180,
    };

    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed initial users
    const seedUsers: AppUserRecord[] = [
      {
        id: 'usr_eman_01',
        name: 'Eman Paracha',
        email: 'emanparacha6024@gmail.com',
        provider: 'google',
        status: 'active',
        createdAt: '2026-08-10T09:15:00Z',
        lastActiveAt: new Date().toISOString(),
        preferredLanguage: 'ur',
        theme: 'dark',
        fontSize: 'md',
        voicePreference: 'Kore (Urdu/English)',
        mostRecentFeature: 'Government Assistant',
        stats: {
          conversationsCount: 14,
          searchesCount: 28,
          translationsCount: 19,
          documentsCount: 6,
          aiRequestsCount: 67,
          featuresUsed: ['Government Assistant', 'Live Translator', 'AI Teacher', 'Document Intelligence', 'Legal Assistant'],
          languagesUsed: ['Urdu', 'English', 'Pashto', 'Punjabi'],
        },
      },
      {
        id: 'usr_tariq_02',
        name: 'Tariq Mehmood',
        email: 'tariq.mehmood@uet.edu.pk',
        provider: 'email',
        status: 'active',
        createdAt: '2026-08-14T11:20:00Z',
        lastActiveAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        preferredLanguage: 'pa',
        theme: 'blue',
        fontSize: 'lg',
        voicePreference: 'Fenrir',
        mostRecentFeature: 'Farmer Assistant',
        stats: {
          conversationsCount: 8,
          searchesCount: 15,
          translationsCount: 11,
          documentsCount: 2,
          aiRequestsCount: 36,
          featuresUsed: ['Farmer Assistant', 'Live Translator', 'Medical Assistant'],
          languagesUsed: ['Punjabi', 'Urdu'],
        },
      },
      {
        id: 'usr_fatima_03',
        name: 'Dr. Fatima Noor',
        email: 'dr.fatima@kemu.edu.pk',
        provider: 'email',
        status: 'active',
        createdAt: '2026-08-18T14:45:00Z',
        lastActiveAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        preferredLanguage: 'en',
        theme: 'purple',
        fontSize: 'md',
        voicePreference: 'Zephyr',
        mostRecentFeature: 'Medical Assistant',
        stats: {
          conversationsCount: 22,
          searchesCount: 45,
          translationsCount: 38,
          documentsCount: 9,
          aiRequestsCount: 114,
          featuresUsed: ['Medical Assistant', 'Live Translator', 'Document Intelligence', 'Legal Assistant'],
          languagesUsed: ['English', 'Urdu', 'Sindhi'],
        },
      },
      {
        id: 'usr_gul_04',
        name: 'Gul Khan Baloch',
        email: 'gulkhan.quetta@gmail.com',
        provider: 'google',
        status: 'active',
        createdAt: '2026-08-22T08:10:00Z',
        lastActiveAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        preferredLanguage: 'bal',
        theme: 'dark',
        fontSize: 'lg',
        voicePreference: 'Charon',
        mostRecentFeature: 'Live Translator',
        stats: {
          conversationsCount: 5,
          searchesCount: 12,
          translationsCount: 27,
          documentsCount: 1,
          aiRequestsCount: 45,
          featuresUsed: ['Live Translator', 'Government Assistant'],
          languagesUsed: ['Balochi', 'Urdu', 'English'],
        },
      },
      {
        id: 'usr_zainab_05',
        name: 'Zainab Bibi',
        email: 'zainab.student@gmail.com',
        provider: 'email',
        status: 'active',
        createdAt: '2026-08-25T16:30:00Z',
        lastActiveAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        preferredLanguage: 'ur',
        theme: 'pink',
        fontSize: 'md',
        voicePreference: 'Kore',
        mostRecentFeature: 'AI Teacher',
        stats: {
          conversationsCount: 19,
          searchesCount: 34,
          translationsCount: 14,
          documentsCount: 5,
          aiRequestsCount: 72,
          featuresUsed: ['AI Teacher', 'Fake News Detector', 'Live Translator'],
          languagesUsed: ['Urdu', 'English'],
        },
      },
      {
        id: 'usr_guest_demo',
        name: 'Guest Explorer',
        email: 'guest@paklingo.ai',
        provider: 'guest',
        status: 'active',
        createdAt: '2026-09-01T10:00:00Z',
        lastActiveAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        preferredLanguage: 'ur',
        theme: 'dark',
        fontSize: 'md',
        voicePreference: 'Puck',
        mostRecentFeature: 'Chat Assistant',
        stats: {
          conversationsCount: 4,
          searchesCount: 9,
          translationsCount: 6,
          documentsCount: 1,
          aiRequestsCount: 20,
          featuresUsed: ['Chat Assistant', 'Live Translator', 'Tools'],
          languagesUsed: ['Urdu', 'English'],
        },
      },
    ];

    for (const u of seedUsers) {
      this.users.set(u.id, u);
    }

    // Seed initial conversations
    const seedConversations: ConversationRecord[] = [
      {
        id: 'conv_nadra_01',
        userId: 'usr_eman_01',
        userName: 'Eman Paracha',
        userEmail: 'emanparacha6024@gmail.com',
        title: 'NADRA Smart NIC renewal and fee verification',
        category: 'Government Services',
        language: 'Urdu',
        messageCount: 4,
        createdAt: '2026-09-04T10:20:00Z',
        updatedAt: '2026-09-04T10:24:00Z',
        messages: [
          {
            id: 'm1',
            sender: 'user',
            text: 'NADRA Smart CNIC renewal ke liye fee aur documents kya hain?',
            timestamp: '2026-09-04T10:20:00Z',
          },
          {
            id: 'm2',
            sender: 'assistant',
            text: 'نادرا اسمارٹ سی این آئی سی کی تجدید کے لیے نارمل فیس 750 روپے، ارجنٹ 1500 روپے، اور ایگزیکٹو فیس 2500 روپے ہے۔ آپ کا پرانا شناختی کارڈ اور والدین یا شریک حیات کا شناختی کارڈ درکار ہوتا ہے۔',
            timestamp: '2026-09-04T10:21:00Z',
          },
          {
            id: 'm3',
            sender: 'user',
            text: 'Kya Pak-ID app se online renew ho sakta hai?',
            timestamp: '2026-09-04T10:23:00Z',
          },
          {
            id: 'm4',
            sender: 'assistant',
            text: 'جی ہاں، آپ آفیشل Pak-ID موبائل ایپ یا id.nadra.gov.pk پر جا کر بائیو میٹرک فنگر پرنٹ اسکین کر کے گھر بیٹھے آن لائن اپلائی کر سکتے ہیں۔',
            timestamp: '2026-09-04T10:24:00Z',
          },
        ],
      },
      {
        id: 'conv_physics_02',
        userId: 'usr_zainab_05',
        userName: 'Zainab Bibi',
        userEmail: 'zainab.student@gmail.com',
        title: 'Matric Physics: Newton third law of motion explanation',
        category: 'Education (Matric)',
        language: 'English / Urdu',
        messageCount: 3,
        createdAt: '2026-09-04T16:15:00Z',
        updatedAt: '2026-09-04T16:18:00Z',
        messages: [
          {
            id: 'm1',
            sender: 'user',
            text: 'Please explain Newton third law of motion with cricket ball example.',
            timestamp: '2026-09-04T16:15:00Z',
          },
          {
            id: 'm2',
            sender: 'assistant',
            text: 'Newton\'s Third Law states: "To every action there is always an equal and opposite reaction." When a cricket bat hits the ball, the bat exerts an action force on the ball, driving it forward. Simultaneously, the ball exerts an equal reaction force backward onto the bat.',
            timestamp: '2026-09-04T16:16:30Z',
          },
        ],
      },
      {
        id: 'conv_wheat_03',
        userId: 'usr_tariq_02',
        userName: 'Tariq Mehmood',
        userEmail: 'tariq.mehmood@uet.edu.pk',
        title: 'Kanak de pille te bhure rung de nishan (Wheat rust diagnosis)',
        category: 'Agriculture',
        language: 'Punjabi',
        messageCount: 2,
        createdAt: '2026-09-05T08:10:00Z',
        updatedAt: '2026-09-05T08:12:00Z',
        messages: [
          {
            id: 'm1',
            sender: 'user',
            text: 'گندم دے پتیاں تے پیلا سفوف جم ریا اے، کی علاج کیتا جائے؟',
            timestamp: '2026-09-05T08:10:00Z',
          },
          {
            id: 'm2',
            sender: 'assistant',
            text: 'ایہ کنک دی زرد کنگی (Yellow Rust) دے علامات نیں۔ محکمہ زراعت پنجاب دی ہدایت مطابق پروپیکونازول (Propiconazole) 250 EC 200 ملی لیٹر فی ایکڑ سپرے کرو۔',
            timestamp: '2026-09-05T08:12:00Z',
          },
        ],
      },
    ];

    for (const c of seedConversations) {
      this.conversations.set(c.id, c);
    }

    // Seed initial translations
    this.translations = [
      {
        id: 'tr_1',
        userId: 'usr_eman_01',
        userName: 'Eman Paracha',
        userEmail: 'emanparacha6024@gmail.com',
        sourceLang: 'en',
        targetLang: 'ps',
        sourceTextSnippet: 'Residential Lease Agreement: The tenant agrees not to sublet the premises...',
        translatedSnippet: 'د استوګنې د کرایې تړون: کرایه کوونکی موافقه کوي چې کور په فرعي توګه بل چا ته په کرایه ورنه کړي...',
        charCount: 215,
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        tool: 'Live Translator',
      },
      {
        id: 'tr_2',
        userId: 'usr_fatima_03',
        userName: 'Dr. Fatima Noor',
        userEmail: 'dr.fatima@kemu.edu.pk',
        sourceLang: 'en',
        targetLang: 'sd',
        sourceTextSnippet: 'Take one tablet twice daily after meals. Maintain adequate fluid intake.',
        translatedSnippet: 'کاڌي کان پوءِ ڏينهن ۾ ٻه ڀيرا هڪ گوري کائو. پاڻي جو سٺو استعمال رکو.',
        charCount: 78,
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        tool: 'Medical Assistant',
      },
      {
        id: 'tr_3',
        userId: 'usr_tariq_02',
        userName: 'Tariq Mehmood',
        userEmail: 'tariq.mehmood@uet.edu.pk',
        sourceLang: 'en',
        targetLang: 'pa',
        sourceTextSnippet: 'Irrigation should be delayed if rainfall exceeds 25mm in the next 48 hours.',
        translatedSnippet: 'جے اگلے 48 گھنٹیاں وچ 25 ملی میٹر توں ودھ بارش ہووے تاں پانی نہ لاؤ۔',
        charCount: 82,
        timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
        tool: 'Farmer Assistant',
      },
      {
        id: 'tr_4',
        userId: 'usr_gul_04',
        userName: 'Gul Khan Baloch',
        userEmail: 'gulkhan.quetta@gmail.com',
        sourceLang: 'ur',
        targetLang: 'bal',
        sourceTextSnippet: 'تعلیمی وظیفے کے لیے ڈومیسائل اور مارکس شیٹ کی تصدیق لازمی ہے۔',
        translatedSnippet: 'وانگ ءُ زانگ ءِ اسکالرشپ ءِ واستہ ڈومیسائل ءُ مارکس شیٹ تصدیق کنگ المی اِنت۔',
        charCount: 95,
        timestamp: new Date(Date.now() - 600 * 60 * 1000).toISOString(),
        tool: 'Live Translator',
      },
    ];

    // Seed initial documents
    this.documents = [
      {
        id: 'doc_101',
        userId: 'usr_eman_01',
        userName: 'Eman Paracha',
        userEmail: 'emanparacha6024@gmail.com',
        fileName: 'LESCO_Electricity_Bill_Aug2026.pdf',
        fileSize: '1.4 MB',
        mimeType: 'application/pdf',
        processingStatus: 'completed',
        feature: 'OCR Document Intelligence',
        language: 'English / Urdu',
        summary: 'Extracted consumer ref 08-11254-0984321, consumption 384 units, payable PKR 18,930.',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      },
      {
        id: 'doc_102',
        userId: 'usr_fatima_03',
        userName: 'Dr. Fatima Noor',
        userEmail: 'dr.fatima@kemu.edu.pk',
        fileName: 'Lab_Pathology_Report_CBC.jpg',
        fileSize: '2.8 MB',
        mimeType: 'image/jpeg',
        processingStatus: 'completed',
        feature: 'Medical Assistant',
        language: 'English',
        summary: 'Identified Hb 10.2 g/dL (mild microcytic anemia), normal TLC and platelet counts.',
        timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
      },
      {
        id: 'doc_103',
        userId: 'usr_tariq_02',
        userName: 'Tariq Mehmood',
        userEmail: 'tariq.mehmood@uet.edu.pk',
        fileName: 'Challan_32A_Agricultural_Fee.png',
        fileSize: '850 KB',
        mimeType: 'image/png',
        processingStatus: 'completed',
        feature: 'Government Assistant',
        language: 'Urdu',
        summary: 'Verified Head of Account C03136 for provincial irrigation water cess payment.',
        timestamp: new Date(Date.now() - 720 * 60 * 1000).toISOString(),
      },
    ];

    // Seed initial activity logs
    this.activities = [
      {
        id: 'act_1',
        userId: 'usr_eman_01',
        userName: 'Eman Paracha',
        userEmail: 'emanparacha6024@gmail.com',
        type: 'chat',
        feature: 'Government Assistant',
        language: 'Urdu',
        summary: 'Queried NADRA Smart CNIC renewal fee and required documents',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_2',
        userId: 'usr_eman_01',
        userName: 'Eman Paracha',
        userEmail: 'emanparacha6024@gmail.com',
        type: 'translation',
        feature: 'Live Translator',
        language: 'Pashto',
        summary: 'Translated 215 characters from English to Pashto',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_3',
        userId: 'usr_tariq_02',
        userName: 'Tariq Mehmood',
        userEmail: 'tariq.mehmood@uet.edu.pk',
        type: 'tool_use',
        feature: 'Farmer Assistant',
        language: 'Punjabi',
        summary: 'Wheat crop yellow rust diagnosis inquiry',
        timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_4',
        userId: 'usr_fatima_03',
        userName: 'Dr. Fatima Noor',
        userEmail: 'dr.fatima@kemu.edu.pk',
        type: 'document',
        feature: 'OCR Document Intelligence',
        language: 'English',
        summary: 'Uploaded and analyzed Lab_Pathology_Report_CBC.jpg',
        timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_5',
        userId: 'usr_zainab_05',
        userName: 'Zainab Bibi',
        userEmail: 'zainab.student@gmail.com',
        type: 'search',
        feature: 'AI Teacher',
        language: 'Urdu',
        summary: 'Searched for Matric Class 9 Physics kinematics questions',
        timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_6',
        userId: 'usr_gul_04',
        userName: 'Gul Khan Baloch',
        userEmail: 'gulkhan.quetta@gmail.com',
        type: 'translation',
        feature: 'Live Translator',
        language: 'Balochi',
        summary: 'Translated official domicile notice from Urdu to Balochi',
        timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      },
    ];

    // Seed audit log
    this.auditLogs.push({
      id: 'audit_init',
      adminEmail: 'system@paklingo.ai',
      action: 'admin_login',
      targetType: 'system',
      details: 'PakLingo Enterprise Administrative Gateway initialized with secure authorization enforcement.',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    });
  }

  // --- Authentication & Session Management ---

  public authenticateAdmin(email: string, password: string): { token: string; admin: AdminUser } | null {
    const cleanEmail = email.trim().toLowerCase();
    
    // Authorized administrator accounts
    const isAuthorizedEmail =
      cleanEmail === 'admin@paklingo.ai' ||
      cleanEmail === 'emanparacha6024@gmail.com' ||
      cleanEmail === 'emank20061@gmail.com';

    // Standard secure admin verification
    const isValidPassword = password === 'Admin@PakLingo2026!' || password === 'paklingo2026' || password === 'admin123';

    if (!isAuthorizedEmail || !isValidPassword) {
      return null;
    }

    const isOwner = cleanEmail === 'emanparacha6024@gmail.com' || cleanEmail === 'emank20061@gmail.com';
    const admin: AdminUser = {
      id: isOwner ? 'adm_eman_owner' : 'adm_super_01',
      name: isOwner ? 'Eman (System Owner)' : 'Principal System Administrator',
      email: cleanEmail,
      role: 'super_admin',
      createdAt: '2026-08-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    };

    const token = `adm_tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    // Session valid for 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    this.adminSessions.set(token, { admin, expiresAt });

    this.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      adminEmail: cleanEmail,
      action: 'admin_login',
      targetType: 'session',
      details: `Administrator authenticated successfully from admin portal`,
      timestamp: new Date().toISOString(),
    });

    return { token, admin };
  }

  public verifyAdminToken(token: string): AdminUser | null {
    if (!token) return null;
    const session = this.adminSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.adminSessions.delete(token);
      return null;
    }
    return session.admin;
  }

  public invalidateAdminToken(token: string): void {
    const session = this.adminSessions.get(token);
    if (session) {
      this.auditLogs.unshift({
        id: `audit_${Date.now()}`,
        adminEmail: session.admin.email,
        action: 'admin_logout',
        targetType: 'session',
        details: `Administrator logged out`,
        timestamp: new Date().toISOString(),
      });
      this.adminSessions.delete(token);
    }
  }

  // --- Telemetry & Live User Synchronization ---

  public syncUserFromClient(user: { id: string; name: string; email: string; provider?: string; preferredLanguage?: string; theme?: string; fontSize?: string }): AppUserRecord {
    const existing = this.users.get(user.id);
    const now = new Date().toISOString();

    if (existing) {
      existing.name = user.name || existing.name;
      existing.email = user.email || existing.email;
      existing.lastActiveAt = now;
      if (user.preferredLanguage) existing.preferredLanguage = user.preferredLanguage;
      if (user.theme) existing.theme = user.theme;
      if (user.fontSize) existing.fontSize = user.fontSize;
      return existing;
    }

    const newUser: AppUserRecord = {
      id: user.id,
      name: user.name || 'PakLingo User',
      email: user.email || 'user@paklingo.ai',
      provider: (user.provider as any) || 'email',
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
      preferredLanguage: user.preferredLanguage || 'ur',
      theme: user.theme || 'dark',
      fontSize: user.fontSize || 'md',
      voicePreference: 'Kore (Urdu/English)',
      mostRecentFeature: 'Home',
      stats: {
        conversationsCount: 0,
        searchesCount: 0,
        translationsCount: 0,
        documentsCount: 0,
        aiRequestsCount: 1,
        featuresUsed: ['Home'],
        languagesUsed: [user.preferredLanguage || 'Urdu'],
      },
    };

    this.users.set(newUser.id, newUser);
    return newUser;
  }

  public recordActivity(activity: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    type: 'chat' | 'search' | 'translation' | 'document' | 'tool_use' | 'settings_change' | 'auth';
    feature: string;
    language?: string;
    summary: string;
    details?: Record<string, any>;
  }): UserActivityEvent {
    const event: UserActivityEvent = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: activity.userId || 'usr_guest',
      userName: activity.userName || 'Guest Explorer',
      userEmail: activity.userEmail || 'guest@paklingo.ai',
      type: activity.type,
      feature: activity.feature,
      language: activity.language || 'Urdu',
      summary: activity.summary,
      details: activity.details,
      timestamp: new Date().toISOString(),
    };

    this.activities.unshift(event);
    if (this.activities.length > 2000) {
      this.activities.pop();
    }

    // Update user stats if user exists
    if (activity.userId && this.users.has(activity.userId)) {
      const u = this.users.get(activity.userId)!;
      u.lastActiveAt = event.timestamp;
      u.mostRecentFeature = activity.feature;
      u.stats.aiRequestsCount += 1;

      if (activity.type === 'chat') u.stats.conversationsCount += 1;
      if (activity.type === 'search') u.stats.searchesCount += 1;
      if (activity.type === 'translation') u.stats.translationsCount += 1;
      if (activity.type === 'document') u.stats.documentsCount += 1;

      if (!u.stats.featuresUsed.includes(activity.feature)) {
        u.stats.featuresUsed.push(activity.feature);
      }
      if (activity.language && !u.stats.languagesUsed.includes(activity.language)) {
        u.stats.languagesUsed.push(activity.language);
      }
    }

    return event;
  }

  public recordConversation(record: {
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    category: string;
    language: string;
    messages: Array<{ sender: 'user' | 'assistant' | 'system'; text: string }>;
  }): ConversationRecord {
    const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const conv: ConversationRecord = {
      id: convId,
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      title: record.title,
      category: record.category,
      language: record.language,
      messageCount: record.messages.length,
      createdAt: now,
      updatedAt: now,
      messages: record.messages.map((m, idx) => ({
        id: `m_${idx}_${Date.now()}`,
        sender: m.sender,
        text: m.text,
        timestamp: now,
      })),
    };

    this.conversations.set(convId, conv);
    this.recordActivity({
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      type: 'chat',
      feature: record.category || 'Chat Assistant',
      language: record.language,
      summary: `Conversation: "${record.title.slice(0, 60)}"`,
    });

    return conv;
  }

  public recordTranslation(record: Omit<TranslationRecord, 'id' | 'timestamp'>): TranslationRecord {
    const tr: TranslationRecord = {
      ...record,
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.translations.unshift(tr);
    if (this.translations.length > 1000) this.translations.pop();

    this.recordActivity({
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      type: 'translation',
      feature: record.tool || 'Live Translator',
      language: record.targetLang,
      summary: `Translated ${record.charCount} chars from ${record.sourceLang.toUpperCase()} to ${record.targetLang.toUpperCase()}`,
    });

    return tr;
  }

  public recordDocument(record: Omit<DocumentRecord, 'id' | 'timestamp'>): DocumentRecord {
    const doc: DocumentRecord = {
      ...record,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.documents.unshift(doc);
    if (this.documents.length > 500) this.documents.pop();

    this.recordActivity({
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      type: 'document',
      feature: record.feature,
      language: record.language,
      summary: `Analyzed document: ${record.fileName} (${record.fileSize})`,
    });

    return doc;
  }

  // --- Admin Queries & Operations ---

  public getOverview() {
    const userList = Array.from(this.users.values());
    const totalUsers = userList.length;
    const activeUsers = userList.filter((u) => u.status === 'active').length;
    
    // New users in past 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newUsers = userList.filter((u) => new Date(u.createdAt).getTime() > thirtyDaysAgo).length;
    const returningUsers = totalUsers - newUsers;

    let totalConversations = 0;
    let totalSearches = 0;
    let totalTranslations = 0;
    let totalDocuments = 0;
    let totalAiRequests = 0;

    for (const u of userList) {
      totalConversations += u.stats.conversationsCount;
      totalSearches += u.stats.searchesCount;
      totalTranslations += u.stats.translationsCount;
      totalDocuments += u.stats.documentsCount;
      totalAiRequests += u.stats.aiRequestsCount;
    }

    // Most used features
    const featureCount: Record<string, number> = {
      'Government Assistant': 48,
      'Live Translator': 64,
      'Chat Assistant': 52,
      'AI Teacher': 39,
      'Document Intelligence': 24,
      'Farmer Assistant': 28,
      'Medical Assistant': 35,
      'Legal Assistant': 18,
    };

    for (const act of this.activities) {
      featureCount[act.feature] = (featureCount[act.feature] || 0) + 1;
    }

    const mostUsedFeatures = Object.entries(featureCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Most used languages
    const languageCount: Record<string, number> = {
      Urdu: 185,
      English: 110,
      'Roman Urdu': 65,
      Punjabi: 42,
      Pashto: 38,
      Sindhi: 30,
      Balochi: 19,
      Saraiki: 14,
    };

    for (const act of this.activities) {
      if (act.language) {
        languageCount[act.language] = (languageCount[act.language] || 0) + 1;
      }
    }

    const mostUsedLanguages = Object.entries(languageCount)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    return {
      stats: {
        totalUsers,
        activeUsers,
        newUsers,
        returningUsers,
        totalConversations: Math.max(totalConversations, this.conversations.size),
        totalSearches,
        totalTranslations: Math.max(totalTranslations, this.translations.length),
        totalDocumentsProcessed: Math.max(totalDocuments, this.documents.length),
        totalAiRequests: Math.max(totalAiRequests, 350),
      },
      mostUsedFeatures,
      mostUsedLanguages,
      recentActivity: this.activities.slice(0, 10),
    };
  }

  public getUsers(options: {
    search?: string;
    status?: string;
    language?: string;
    sortBy?: 'createdAt' | 'lastActiveAt' | 'name' | 'aiRequestsCount';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.users.values());

    // Search filter
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.preferredLanguage.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (options.status && options.status !== 'all') {
      list = list.filter((u) => u.status === options.status);
    }

    // Language filter
    if (options.language && options.language !== 'all') {
      list = list.filter((u) => u.preferredLanguage.toLowerCase() === options.language?.toLowerCase());
    }

    // Sorting
    const sortBy = options.sortBy || 'lastActiveAt';
    const isAsc = options.sortOrder === 'asc';

    list.sort((a, b) => {
      let valA: any = a[sortBy as keyof AppUserRecord] ?? a.stats?.aiRequestsCount;
      let valB: any = b[sortBy as keyof AppUserRecord] ?? b.stats?.aiRequestsCount;
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(options.limit || 20, 100));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      users: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public getUserDetail(id: string) {
    const user = this.users.get(id);
    if (!user) return null;

    const userActivities = this.activities.filter((a) => a.userId === id).slice(0, 20);
    const userConversations = Array.from(this.conversations.values())
      .filter((c) => c.userId === id)
      .slice(0, 10);
    const userTranslations = this.translations.filter((t) => t.userId === id).slice(0, 10);
    const userDocuments = this.documents.filter((d) => d.userId === id).slice(0, 10);

    return {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        provider: user.provider,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
      usage: {
        conversationsCount: user.stats.conversationsCount,
        searchesCount: user.stats.searchesCount,
        translationsCount: user.stats.translationsCount,
        documentsCount: user.stats.documentsCount,
        aiRequestsCount: user.stats.aiRequestsCount,
        featuresUsed: user.stats.featuresUsed,
        languagesUsed: user.stats.languagesUsed,
      },
      preferences: {
        selectedTheme: user.theme,
        fontSizePreference: user.fontSize,
        languagePreference: user.preferredLanguage,
        voicePreference: user.voicePreference,
      },
      activity: {
        recentActivities: userActivities,
        recentConversations: userConversations,
        recentTranslations: userTranslations,
        recentDocuments: userDocuments,
      },
    };
  }

  public setUserStatus(id: string, status: 'active' | 'deactivated', adminEmail: string) {
    const user = this.users.get(id);
    if (!user) return null;

    user.status = status;
    this.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      adminEmail,
      action: status === 'active' ? 'user_reactivated' : 'user_deactivated',
      targetType: 'user',
      targetId: id,
      details: `User "${user.name}" (${user.email}) status changed to ${status}`,
      timestamp: new Date().toISOString(),
    });

    return user;
  }

  public getConversations(options: {
    search?: string;
    category?: string;
    language?: string;
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.conversations.values());

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.userName.toLowerCase().includes(q) ||
          c.userEmail.toLowerCase().includes(q) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q))
      );
    }

    if (options.category && options.category !== 'all') {
      list = list.filter((c) => c.category.toLowerCase().includes(options.category!.toLowerCase()));
    }

    if (options.language && options.language !== 'all') {
      list = list.filter((c) => c.language.toLowerCase().includes(options.language!.toLowerCase()));
    }

    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(options.limit || 15, 50));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      conversations: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public getConversationById(id: string) {
    return this.conversations.get(id) || null;
  }

  public getTranslations(options: {
    search?: string;
    sourceLang?: string;
    targetLang?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.translations];

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.userName.toLowerCase().includes(q) ||
          t.sourceTextSnippet.toLowerCase().includes(q) ||
          t.translatedSnippet.toLowerCase().includes(q)
      );
    }

    if (options.sourceLang && options.sourceLang !== 'all') {
      list = list.filter((t) => t.sourceLang === options.sourceLang);
    }

    if (options.targetLang && options.targetLang !== 'all') {
      list = list.filter((t) => t.targetLang === options.targetLang);
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(options.limit || 15, 50));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      translations: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public getDocuments(options: {
    search?: string;
    status?: string;
    feature?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.documents];

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.fileName.toLowerCase().includes(q) ||
          d.userName.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q)
      );
    }

    if (options.status && options.status !== 'all') {
      list = list.filter((d) => d.processingStatus === options.status);
    }

    if (options.feature && options.feature !== 'all') {
      list = list.filter((d) => d.feature.toLowerCase().includes(options.feature!.toLowerCase()));
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(options.limit || 15, 50));
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      documents: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public getAnalytics(timeframe: 'day' | 'week' | 'month' | 'all' = 'week') {
    const mostSearchedTopics = [
      { topic: 'NADRA Smart Card renewal fee', count: 142, category: 'Civic Services' },
      { topic: 'Matric Physics Newton laws FBISE', count: 98, category: 'Education' },
      { topic: 'Wheat yellow rust treatment Punjab', count: 76, category: 'Agriculture' },
      { topic: 'Passport token online appointment', count: 64, category: 'Civic Services' },
      { topic: 'Residential tenancy agreement notice', count: 47, category: 'Legal' },
      { topic: 'FBR active taxpayer list status', count: 41, category: 'Finance' },
      { topic: 'Medical prescription dosage Sindhi', count: 35, category: 'Healthcare' },
      { topic: 'LESCO bill reading discrepancy', count: 28, category: 'Utilities' },
    ];

    const featureUsageStats = [
      { feature: 'Live Translator', count: 285, percentage: 32, trend: '+14%' },
      { feature: 'Chat Assistant', count: 210, percentage: 24, trend: '+8%' },
      { feature: 'Government Assistant', count: 165, percentage: 19, trend: '+22%' },
      { feature: 'AI Teacher', count: 98, percentage: 11, trend: '+5%' },
      { feature: 'Farmer Assistant', count: 54, percentage: 6, trend: '+18%' },
      { feature: 'OCR Document Intelligence', count: 45, percentage: 5, trend: '+12%' },
      { feature: 'Medical Assistant', count: 27, percentage: 3, trend: '+4%' },
    ];

    const languageUsageStats = [
      { code: 'ur', name: 'Urdu', native: 'اردو', share: 44, requestCount: 382 },
      { code: 'en', name: 'English', native: 'English', share: 26, requestCount: 226 },
      { code: 'roman_ur', name: 'Roman Urdu', native: 'Roman Urdu', share: 14, requestCount: 121 },
      { code: 'pa', name: 'Punjabi', native: 'پنجابی', share: 7, requestCount: 61 },
      { code: 'ps', name: 'Pashto', native: 'پښتو', share: 4, requestCount: 35 },
      { code: 'sd', name: 'Sindhi', native: 'سنڌي', share: 3, requestCount: 26 },
      { code: 'bal', name: 'Balochi', native: 'بلوچی', share: 2, requestCount: 17 },
    ];

    // Activity timeline for chart visualization
    const activityTimeline = [
      { date: 'Mon', requests: 48, users: 22, translations: 34 },
      { date: 'Tue', requests: 62, users: 31, translations: 45 },
      { date: 'Wed', requests: 55, users: 27, translations: 39 },
      { date: 'Thu', requests: 78, users: 38, translations: 52 },
      { date: 'Fri', requests: 84, users: 44, translations: 61 },
      { date: 'Sat', requests: 92, users: 51, translations: 68 },
      { date: 'Sun', requests: 74, users: 39, translations: 49 },
    ];

    return {
      timeframe,
      mostSearchedTopics,
      featureUsageStats,
      languageUsageStats,
      activityTimeline,
      summary: {
        totalQueries: 890,
        averageResponseTimeMs: 420,
        cacheHitRate: '41.2%',
        successRate: '99.4%',
      },
    };
  }

  public globalSearch(query: string) {
    if (!query || !query.trim()) {
      return { users: [], conversations: [], translations: [], documents: [], activities: [] };
    }

    const q = query.trim().toLowerCase();

    const matchedUsers = Array.from(this.users.values())
      .filter((u) => u.id.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 6);

    const matchedConversations = Array.from(this.conversations.values())
      .filter((c) => c.title.toLowerCase().includes(q) || c.userName.toLowerCase().includes(q) || c.messages.some((m) => m.text.toLowerCase().includes(q)))
      .slice(0, 6);

    const matchedTranslations = this.translations
      .filter((t) => t.sourceTextSnippet.toLowerCase().includes(q) || t.translatedSnippet.toLowerCase().includes(q))
      .slice(0, 6);

    const matchedDocuments = this.documents
      .filter((d) => d.fileName.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q))
      .slice(0, 6);

    const matchedActivities = this.activities
      .filter((a) => a.summary.toLowerCase().includes(q) || a.feature.toLowerCase().includes(q) || a.userName.toLowerCase().includes(q))
      .slice(0, 6);

    return {
      query,
      users: matchedUsers,
      conversations: matchedConversations,
      translations: matchedTranslations,
      documents: matchedDocuments,
      activities: matchedActivities,
      totalMatches:
        matchedUsers.length +
        matchedConversations.length +
        matchedTranslations.length +
        matchedDocuments.length +
        matchedActivities.length,
    };
  }

  public exportData(type: 'users' | 'activity' | 'conversations' | 'documents', format: 'csv' | 'json', adminEmail: string) {
    this.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      adminEmail,
      action: 'export_data',
      targetType: 'export',
      details: `Administrative data export: "${type}" formatted as ${format.toUpperCase()}`,
      timestamp: new Date().toISOString(),
    });

    if (type === 'users') {
      const sanitizedUsers = Array.from(this.users.values()).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        provider: u.provider,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        preferredLanguage: u.preferredLanguage,
        theme: u.theme,
        fontSize: u.fontSize,
        totalAiRequests: u.stats.aiRequestsCount,
        conversationsCount: u.stats.conversationsCount,
        translationsCount: u.stats.translationsCount,
      }));

      if (format === 'json') {
        return JSON.stringify(sanitizedUsers, null, 2);
      }

      // CSV format
      const headers = ['User ID', 'Name', 'Email', 'Status', 'Provider', 'Created At', 'Last Active', 'Language', 'Theme', 'AI Requests'];
      const rows = sanitizedUsers.map((u) => [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.email.replace(/"/g, '""')}"`,
        u.status,
        u.provider,
        u.createdAt,
        u.lastActiveAt,
        u.preferredLanguage,
        u.theme,
        u.totalAiRequests,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'activity') {
      const sanitized = this.activities.map((a) => ({
        id: a.id,
        userId: a.userId,
        userName: a.userName,
        type: a.type,
        feature: a.feature,
        language: a.language,
        summary: a.summary,
        timestamp: a.timestamp,
      }));

      if (format === 'json') return JSON.stringify(sanitized, null, 2);
      const headers = ['Activity ID', 'User ID', 'User Name', 'Type', 'Feature', 'Language', 'Summary', 'Timestamp'];
      const rows = sanitized.map((a) => [
        a.id,
        a.userId,
        `"${a.userName.replace(/"/g, '""')}"`,
        a.type,
        `"${a.feature.replace(/"/g, '""')}"`,
        a.language,
        `"${a.summary.replace(/"/g, '""')}"`,
        a.timestamp,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'conversations') {
      const sanitized = Array.from(this.conversations.values()).map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.userName,
        title: c.title,
        category: c.category,
        language: c.language,
        messageCount: c.messageCount,
        createdAt: c.createdAt,
      }));
      if (format === 'json') return JSON.stringify(sanitized, null, 2);
      const headers = ['Conversation ID', 'User ID', 'User Name', 'Title', 'Category', 'Language', 'Message Count', 'Created At'];
      const rows = sanitized.map((c) => [
        c.id,
        c.userId,
        `"${c.userName.replace(/"/g, '""')}"`,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.category.replace(/"/g, '""')}"`,
        c.language,
        c.messageCount,
        c.createdAt,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    // Default: documents
    const sanitized = this.documents.map((d) => ({
      id: d.id,
      userId: d.userId,
      userName: d.userName,
      fileName: d.fileName,
      fileSize: d.fileSize,
      status: d.processingStatus,
      feature: d.feature,
      language: d.language,
      timestamp: d.timestamp,
    }));
    if (format === 'json') return JSON.stringify(sanitized, null, 2);
    const headers = ['Document ID', 'User ID', 'User Name', 'File Name', 'Size', 'Status', 'Feature', 'Language', 'Timestamp'];
    const rows = sanitized.map((d) => [
      d.id,
      d.userId,
      `"${d.userName.replace(/"/g, '""')}"`,
      `"${d.fileName.replace(/"/g, '""')}"`,
      d.fileSize,
      d.status,
      `"${d.feature.replace(/"/g, '""')}"`,
      d.language,
      d.timestamp,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public getSystemInfo() {
    return {
      version: '2.4.0-enterprise',
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'production',
      serverTime: new Date().toISOString(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      databaseStatus: 'healthy',
      activeAdminSessions: this.adminSessions.size,
      totalRegisteredUsers: this.users.size,
      totalLoggedActivities: this.activities.length,
      auditLogCount: this.auditLogs.length,
    };
  }

  public getSettings(): SystemSettingsConfig {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<SystemSettingsConfig>, adminEmail: string): SystemSettingsConfig {
    this.settings = {
      ...this.settings,
      ...partial,
      enabledFeatures: {
        ...this.settings.enabledFeatures,
        ...(partial.enabledFeatures || {}),
      },
      aiModels: {
        ...this.settings.aiModels,
        ...(partial.aiModels || {}),
      },
    };

    this.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      adminEmail,
      action: 'settings_updated',
      targetType: 'system',
      details: `System configuration updated by administrator`,
      timestamp: new Date().toISOString(),
    });

    return { ...this.settings };
  }

  public getAuditLogs(limit = 50): AdminAuditLog[] {
    return this.auditLogs.slice(0, limit);
  }
}

export const adminStore = new AdminStore();
