import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global anti-cache headers for all API requests
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// --- Auth & User Database Workspace ---
app.post('/api/auth/user', (req, res) => {
  try {
    const { id, email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = db.getOrCreateUser({ id, email, name, avatar });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Auth failed' });
  }
});

// Admin login (email + password)
app.post('/api/auth/admin-login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' });
    }

    const isValid = db.validateAdmin(email, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный email или пароль администратора' });
    }

    const admin = db.getAdmin();
    const session = db.createSession({
      email: admin.email,
      name: admin.name,
      role: 'team',
      isAdmin: true,
    });

    res.json({
      success: true,
      token: session.token,
      user: {
        email: admin.email,
        name: admin.name,
        role: 'team',
        isAdmin: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ошибка входа' });
  }
});

// Member project access login (by email only)
app.post('/api/auth/member-login', (req, res) => {
  try {
    const { email, projectId } = req.body;
    if (!email || !projectId) {
      return res.status(400).json({ error: 'Укажите email и идентификатор проекта' });
    }

    const access = db.checkMemberAccess(projectId, email);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        inMembers: false,
        hasPendingRequest: access.hasPendingRequest || false,
        error: access.error || 'Email не найден в списке участников этого проекта',
      });
    }

    const session = db.createSession({
      email,
      name: access.name || email.split('@')[0],
      role: access.role,
      isAdmin: access.isAdmin,
      projectId,
    });

    const projectData = db.getProject(projectId);

    res.json({
      success: true,
      token: session.token,
      user: {
        email: session.email,
        name: session.name,
        role: session.role,
        isAdmin: session.isAdmin,
      },
      project: projectData?.project,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ошибка авторизации участника' });
  }
});

// Check current session token
app.get('/api/auth/session', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token) as string;

    if (!token) {
      return res.status(401).json({ valid: false, error: 'Токен отсутствует' });
    }

    const session = db.getSession(token);
    if (!session) {
      return res.status(401).json({ valid: false, error: 'Сессия недействительна или истекла' });
    }

    res.json({
      valid: true,
      session,
      user: {
        email: session.email,
        name: session.name,
        role: session.role,
        isAdmin: session.isAdmin,
        projectId: session.projectId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// Logout session
app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.token) as string;
    if (token) {
      db.deleteSession(token);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin change password
app.post('/api/auth/admin-change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = db.getAdmin();
    if (!db.validateAdmin(admin.email, currentPassword)) {
      return res.status(401).json({ error: 'Текущий пароль неверен' });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Новый пароль должен содержать минимум 4 символа' });
    }

    db.updateAdminPassword(newPassword);
    res.json({ success: true, message: 'Пароль успешно обновлен' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Multi-Project Management Endpoints ---

// Get all projects for current user (or all if demo mode)
app.get('/api/projects', (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const userEmail = req.query.userEmail as string | undefined;
    const projects = db.getProjectsForUser(userId, userEmail);
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new project
app.post('/api/projects', (req, res) => {
  try {
    const { project, creator } = req.body;
    if (!project || !project.name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    const result = db.createProject(project, creator || { id: 'default-user', email: 'demo@complspec.kz' });
    res.json({ success: true, project: result.project, items: result.items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific project and its items
app.get('/api/projects/:id', (req, res) => {
  try {
    const userEmail = (req.query.userEmail as string | undefined)?.toLowerCase().trim();
    const result = db.getProject(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }

    let userRoleInProject: 'team' | 'client' | 'contractor' | null = null;
    let isMemberOrAdmin = false;
    if (userEmail) {
      const isOwner =
        (result.project.ownerEmail && result.project.ownerEmail.toLowerCase() === userEmail) ||
        userEmail === 'wl.chvlad@gmail.com';
      if (isOwner) {
        userRoleInProject = 'team';
        isMemberOrAdmin = true;
      } else {
        const member = result.project.members?.find((m) => m.email.toLowerCase() === userEmail);
        if (member) {
          userRoleInProject = member.role;
          isMemberOrAdmin = true;
        } else {
          userRoleInProject = null;
          isMemberOrAdmin = false;
        }
      }
    } else {
      userRoleInProject = 'team';
      isMemberOrAdmin = true;
    }

    res.json({
      success: true,
      project: {
        ...result.project,
        userRoleInProject,
      },
      items: result.items,
      isMemberOrAdmin,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Quick project access check for user email
app.get('/api/projects/:id/access-check', (req, res) => {
  try {
    const email = (req.query.email as string || '').toLowerCase().trim();
    if (!email) {
      return res.json({ allowed: false });
    }
    const access = db.checkMemberAccess(req.params.id, email);
    res.json({
      allowed: access.allowed,
      role: access.role,
      isAdmin: access.isAdmin,
      hasPendingRequest: access.hasPendingRequest || false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time live SSE stream registry
const projectSseClients = new Map<string, Set<express.Response>>();

function broadcastProjectUpdate(projectId: string, payload: any) {
  const clients = projectSseClients.get(projectId);
  if (clients && clients.size > 0) {
    const raw = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) {
      try {
        client.write(raw);
      } catch {
        // Ignored, client will be cleaned up on close
      }
    }
  }
}

// Server-Sent Events (SSE) stream for instantaneous sync
app.get('/api/projects/:id/stream', (req, res) => {
  const projectId = req.params.id;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (!projectSseClients.has(projectId)) {
    projectSseClients.set(projectId, new Set());
  }
  projectSseClients.get(projectId)!.add(res);

  // Initial connect frame
  res.write(`data: ${JSON.stringify({ type: 'connected', projectId, timestamp: Date.now() })}\n\n`);

  // Heartbeat ping every 25 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = projectSseClients.get(projectId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        projectSseClients.delete(projectId);
      }
    }
  });
});

// Update project settings/details
app.put('/api/projects/:id', (req, res) => {
  try {
    const updated = db.updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    broadcastProjectUpdate(req.params.id, {
      type: 'project_updated',
      projectId: req.params.id,
      updatedAt: updated.updatedAt,
      version: (updated as any).version || 1,
    });
    res.json({ success: true, project: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  try {
    const success = db.deleteProject(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save & Sync items and project data online
app.post('/api/projects/:id/sync', (req, res) => {
  try {
    const { project, items } = req.body;
    const result = db.syncProjectAndItems(req.params.id, project, items);
    broadcastProjectUpdate(req.params.id, {
      type: 'sync',
      projectId: req.params.id,
      updatedAt: result.updatedAt,
      version: result.version,
      itemsCount: result.itemsCount,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Invite member to project by email
app.post('/api/projects/:id/invite', (req, res) => {
  try {
    const { inviterEmail, email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }
    const result = db.inviteMember(req.params.id, inviterEmail || 'owner', email, role);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    broadcastProjectUpdate(req.params.id, {
      type: 'members_updated',
      projectId: req.params.id,
    });
    res.json({ success: true, member: result.member });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update member role in project
app.patch('/api/projects/:id/members', (req, res) => {
  try {
    const { email, role } = req.body;
    const projectRes = db.getProject(req.params.id);
    if (!projectRes || !projectRes.project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projectRes.project;
    if (!project.members) project.members = [];

    const cleanEmail = (email || '').toLowerCase().trim();
    let member = project.members.find((m) => m.email.toLowerCase() === cleanEmail);
    if (member) {
      member.role = role;
      member.status = 'active';
    } else if (cleanEmail) {
      member = {
        id: `mem-${Date.now()}`,
        email: cleanEmail,
        role: role,
        status: 'active',
        invitedAt: new Date().toISOString(),
      };
      project.members.push(member);
    }

    db.updateProject(req.params.id, { members: project.members });
    broadcastProjectUpdate(req.params.id, {
      type: 'members_updated',
      projectId: req.params.id,
      email: cleanEmail,
      role,
    });
    res.json({ success: true, members: project.members, member });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lightweight version check for real-time auto-sync
app.get('/api/projects/:id/version', (req, res) => {
  try {
    const result = db.getProject(req.params.id);
    if (!result) return res.status(404).json({ error: 'Project not found' });
    res.json({
      success: true,
      updatedAt: result.project.updatedAt,
      version: (result.project as any).version || 1,
      itemsCount: result.items.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member from project
app.delete('/api/projects/:id/members', (req, res) => {
  try {
    const { email } = req.body;
    const success = db.removeMember(req.params.id, email);
    broadcastProjectUpdate(req.params.id, {
      type: 'members_updated',
      projectId: req.params.id,
    });
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public project info for visitors / shareable link gate
app.get('/api/projects/:id/public', (req, res) => {
  try {
    const pub = db.getPublicProjectInfo(req.params.id);
    if (!pub) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    res.json({ success: true, project: pub });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get access requests for project (Admin only)
app.get('/api/projects/:id/access-requests', (req, res) => {
  try {
    const requests = db.getAccessRequests(req.params.id);
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit access request (Guest visitor)
app.post('/api/projects/:id/access-requests', (req, res) => {
  try {
    const { email, name, requestedRole, message } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Укажите email' });
    }

    const result = db.createAccessRequest(req.params.id, {
      email,
      name,
      requestedRole,
      message,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    broadcastProjectUpdate(req.params.id, {
      type: 'access_requests_updated',
      projectId: req.params.id,
      request: result.request,
    });

    res.json({ success: true, request: result.request });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Review access request (Approve / Reject) (Admin only)
app.post('/api/projects/:id/access-requests/:reqId/review', (req, res) => {
  try {
    const { action, role } = req.body;
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Некорректное действие' });
    }

    const result = db.reviewAccessRequest(req.params.id, req.params.reqId, action, role);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    broadcastProjectUpdate(req.params.id, {
      type: 'access_requests_updated',
      projectId: req.params.id,
      request: result.request,
    });

    if (action === 'approve') {
      broadcastProjectUpdate(req.params.id, {
        type: 'members_updated',
        projectId: req.params.id,
        member: result.member,
      });
    }

    res.json({
      success: true,
      action,
      member: result.member,
      request: result.request,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Backwards Compatibility for /api/sync ---
app.get('/api/sync', (req, res) => {
  const all = db.getProjectsForUser();
  const first = all[0];
  if (first) {
    const full = db.getProject(first.id);
    res.json({
      project: full?.project || null,
      items: full?.items || [],
      lastModified: Date.now(),
    });
  } else {
    res.json({ project: null, items: [], lastModified: Date.now() });
  }
});

app.post('/api/sync', (req, res) => {
  const { project, items } = req.body;
  if (project && project.id) {
    db.syncProjectAndItems(project.id, project, items);
  }
  res.json({ success: true, lastModified: Date.now() });
});

// Email dispatch endpoint
app.post('/api/email-report', (req, res) => {
  const { recipientEmail, subject, format, projectName, itemsCount, totalAmount } = req.body;

  console.log(`[Email Dispatch] Sending ${format} report for "${projectName}" to ${recipientEmail}...`);

  setTimeout(() => {
    res.json({
      success: true,
      messageId: `msg-${Date.now()}`,
      sentTo: recipientEmail,
      timestamp: new Date().toISOString(),
      reportFormat: format,
    });
  }, 400);
});

// Vite middleware / static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Development SPA fallback: transforms and serves index.html for all non-API routes
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`COMPLSPEC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
