/**
 * PakLingo AI - Administrative Express API Router
 * Enforces strict server-side authorization for all administration endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { adminStore, AdminUser } from './adminStore.js';

export const adminRouter = Router();

// Extend Express Request type to include authenticated admin
export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminUser;
}

/**
 * Server-side Authorization Middleware
 * Verifies Bearer session token on every protected admin endpoint.
 * Non-admins receive an immediate 401/403 HTTP response.
 */
export function requireAdminAuth(req: AuthenticatedAdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED_ADMIN_ACCESS',
      message: 'Access denied: Valid administrator authorization token required.',
    });
  }

  const token = authHeader.substring(7).trim();
  const admin = adminStore.verifyAdminToken(token);

  if (!admin) {
    return res.status(403).json({
      error: 'FORBIDDEN_ADMIN_ACCESS',
      message: 'Forbidden: Administrator credentials are invalid or have expired.',
    });
  }

  req.admin = admin;
  next();
}

// ----------------------------------------------------
// Public Admin Authentication Endpoints
// ----------------------------------------------------

adminRouter.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      error: 'MISSING_CREDENTIALS',
      message: 'Both administrator email and password are required.',
    });
  }

  const authResult = adminStore.authenticateAdmin(email, password);
  if (!authResult) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid administrative email or security password.',
    });
  }

  res.json({
    success: true,
    token: authResult.token,
    admin: authResult.admin,
  });
});

adminRouter.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    adminStore.invalidateAdminToken(token);
  }
  res.json({ success: true, message: 'Logged out of admin session successfully.' });
});

// ----------------------------------------------------
// Protected Admin Endpoints (Require Valid Admin Token)
// ----------------------------------------------------

adminRouter.get('/api/admin/me', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  res.json({
    success: true,
    admin: req.admin,
  });
});

adminRouter.get('/api/admin/overview', requireAdminAuth, (_req: AuthenticatedAdminRequest, res: Response) => {
  const overview = adminStore.getOverview();
  res.json(overview);
});

adminRouter.get('/api/admin/users', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { search, status, language, sortBy, sortOrder, page, limit } = req.query;

  const result = adminStore.getUsers({
    search: typeof search === 'string' ? search : undefined,
    status: typeof status === 'string' ? status : undefined,
    language: typeof language === 'string' ? language : undefined,
    sortBy: typeof sortBy === 'string' ? (sortBy as any) : undefined,
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });

  res.json(result);
});

adminRouter.get('/api/admin/users/:id', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { id } = req.params;
  const detail = adminStore.getUserDetail(id);

  if (!detail) {
    return res.status(404).json({
      error: 'USER_NOT_FOUND',
      message: `User record with ID ${id} not found.`,
    });
  }

  res.json(detail);
});

adminRouter.patch('/api/admin/users/:id/status', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'deactivated') {
    return res.status(400).json({
      error: 'INVALID_STATUS',
      message: 'Status must be either "active" or "deactivated".',
    });
  }

  const updated = adminStore.setUserStatus(id, status, req.admin!.email);
  if (!updated) {
    return res.status(404).json({
      error: 'USER_NOT_FOUND',
      message: `User with ID ${id} was not found.`,
    });
  }

  res.json({
    success: true,
    user: updated,
    message: `User ${updated.name} has been ${status === 'active' ? 'reactivated' : 'deactivated'}.`,
  });
});

adminRouter.get('/api/admin/conversations', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { search, category, language, page, limit } = req.query;

  const result = adminStore.getConversations({
    search: typeof search === 'string' ? search : undefined,
    category: typeof category === 'string' ? category : undefined,
    language: typeof language === 'string' ? language : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 15,
  });

  res.json(result);
});

adminRouter.get('/api/admin/conversations/:id', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { id } = req.params;
  const conv = adminStore.getConversationById(id);

  if (!conv) {
    return res.status(404).json({
      error: 'CONVERSATION_NOT_FOUND',
      message: `Conversation record ${id} not found.`,
    });
  }

  res.json(conv);
});

adminRouter.get('/api/admin/translations', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { search, sourceLang, targetLang, page, limit } = req.query;

  const result = adminStore.getTranslations({
    search: typeof search === 'string' ? search : undefined,
    sourceLang: typeof sourceLang === 'string' ? sourceLang : undefined,
    targetLang: typeof targetLang === 'string' ? targetLang : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 15,
  });

  res.json(result);
});

adminRouter.get('/api/admin/documents', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { search, status, feature, page, limit } = req.query;

  const result = adminStore.getDocuments({
    search: typeof search === 'string' ? search : undefined,
    status: typeof status === 'string' ? status : undefined,
    feature: typeof feature === 'string' ? feature : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 15,
  });

  res.json(result);
});

adminRouter.get('/api/admin/analytics', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const { timeframe } = req.query;
  const analytics = adminStore.getAnalytics((timeframe as any) || 'week');
  res.json(analytics);
});

adminRouter.get('/api/admin/search', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const searchResults = adminStore.globalSearch(query);
  res.json(searchResults);
});

adminRouter.get('/api/admin/export', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const type = (req.query.type as any) || 'users';
  const format = (req.query.format as any) === 'json' ? 'json' : 'csv';

  const data = adminStore.exportData(type, format, req.admin!.email);

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="paklingo_admin_${type}_export.json"`);
    return res.send(data);
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="paklingo_admin_${type}_export.csv"`);
  res.send(data);
});

adminRouter.get('/api/admin/system', requireAdminAuth, (_req: AuthenticatedAdminRequest, res: Response) => {
  res.json(adminStore.getSystemInfo());
});

adminRouter.get('/api/admin/settings', requireAdminAuth, (_req: AuthenticatedAdminRequest, res: Response) => {
  res.json(adminStore.getSettings());
});

adminRouter.patch('/api/admin/settings', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const updated = adminStore.updateSettings(req.body, req.admin!.email);
  res.json({
    success: true,
    settings: updated,
    message: 'System settings updated successfully.',
  });
});

adminRouter.get('/api/admin/audit-logs', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  res.json(adminStore.getAuditLogs(limit));
});

// ----------------------------------------------------
// Public Telemetry Ingestion Endpoints (Called by User App)
// ----------------------------------------------------

adminRouter.post('/api/telemetry/user-sync', (req: Request, res: Response) => {
  const user = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  const synced = adminStore.syncUserFromClient(user);
  res.json({ success: true, user: synced });
});

adminRouter.post('/api/telemetry/event', (req: Request, res: Response) => {
  const event = req.body;
  if (!event || !event.type || !event.feature) {
    return res.status(400).json({ error: 'Valid event data required' });
  }
  const recorded = adminStore.recordActivity(event);
  res.json({ success: true, event: recorded });
});

adminRouter.post('/api/telemetry/conversation', (req: Request, res: Response) => {
  const conv = req.body;
  if (!conv || !conv.userId || !conv.title) {
    return res.status(400).json({ error: 'Valid conversation required' });
  }
  const recorded = adminStore.recordConversation(conv);
  res.json({ success: true, conversation: recorded });
});

adminRouter.post('/api/telemetry/translation', (req: Request, res: Response) => {
  const tr = req.body;
  if (!tr || !tr.userId || !tr.sourceLang || !tr.targetLang) {
    return res.status(400).json({ error: 'Valid translation required' });
  }
  const recorded = adminStore.recordTranslation(tr);
  res.json({ success: true, translation: recorded });
});

adminRouter.post('/api/telemetry/document', (req: Request, res: Response) => {
  const doc = req.body;
  if (!doc || !doc.userId || !doc.fileName) {
    return res.status(400).json({ error: 'Valid document metadata required' });
  }
  const recorded = adminStore.recordDocument(doc);
  res.json({ success: true, document: recorded });
});
