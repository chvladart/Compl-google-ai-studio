import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parsing middleware
app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((c) => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k] = v.join('=');
  });
  (req as any).cookies = cookies;
  next();
});

// Session middleware — attaches req.session if valid session cookie exists
app.use('/api', (req, _res, next) => {
  const token = (req as any).cookies?.session;
  if (token) {
    const session = db.getSession(token);
    if (session) {
      (req as any).session = session;
    }
  }
  next();
});

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

// --- Auth: Admin Login (email + password) ---
app.post('/api/auth/admin-login', (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = (process.env.ADMIN_EMAIL || 'wl.chvlad@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'complspec2026';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    if (email.toLowerCase().trim() !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = db.createSession(adminEmail, 'team', true);
    res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
    res.json({ success: true, user: { email: adminEmail, role: 'team', isAdmin: true } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Auth failed' });
  }
});

// --- Auth: Member Login (email only, per project) ---
app.post('/api/auth/member-login', (req, res) => {
  try {
    const { email, projectId } = req.body;
    if (!email || !projectId) {
      return res.status(400).json({ error: 'Email и проект обязательны' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const result = db.getProject(projectId);
    if (!result) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    // Check if this is the admin email
    const adminEmail = (process.env.ADMIN_EMAIL || 'wl.chvlad@gmail.com').toLowerCase().trim();
    if (cleanEmail === adminEmail) {
      const token = db.createSession(adminEmail, 'team', true);
      res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
      return res.json({ success: true, user: { email: adminEmail, role: 'team', isAdmin: true } });
    }

    // Check if email is in project members
    const member = result.project.members?.find((m) => m.email.toLowerCase().trim() === cleanEmail);
    if (!member) {
      return res.status(403).json({ error: 'not_member' });
    }

    const token = db.createSession(cleanEmail, member.role, false, projectId);
    res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
    res.json({ success: true, user: { email: cleanEmail, role: member.role, isAdmin: false, projectId } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Auth failed' });
  }
});

// --- Auth: Get current session ---
app.get('/api/auth/me', (req, res) => {
  const session = (req as any).session;
  if (!session) {
    return res.json({ success: false });
  }
  res.json({
    success: true,
    user: {
      email: session.email,
      role: session.role,
      isAdmin: session.isAdmin,
      projectId: session.projectId,
    },
  });
});

// --- Auth: Logout ---
app.post('/api/auth/logout', (req, res) => {
  const token = (req as any).cookies?.session;
  if (token) {
    db.deleteSession(token);
  }
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ success: true });
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

    let userRoleInProject: 'team' | 'client' | 'contractor' = 'team';
    if (userEmail) {
      const isOwner =
        (result.project.ownerEmail && result.project.ownerEmail.toLowerCase() === userEmail) ||
        userEmail === 'wl.chvlad@gmail.com';
      if (isOwner) {
        userRoleInProject = 'team';
      } else {
        const member = result.project.members?.find((m) => m.email.toLowerCase() === userEmail);
        if (member) {
          userRoleInProject = member.role;
        } else {
          userRoleInProject = 'client';
        }
      }
    }

    res.json({
      success: true,
      project: {
        ...result.project,
        userRoleInProject,
      },
      items: result.items,
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

// --- Access Requests ---

// Guest submits a request for access to a project
app.post('/api/projects/:id/request-access', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }
    const result = db.createAccessRequest(req.params.id, email);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    // Notify admin via SSE
    broadcastProjectUpdate(req.params.id, {
      type: 'access_request',
      projectId: req.params.id,
    });
    res.json({ success: true, request: result.request });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin gets pending access requests for a project
app.get('/api/projects/:id/requests', (req, res) => {
  try {
    const requests = db.getAccessRequests(req.params.id);
    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin approves an access request
app.post('/api/projects/:id/requests/:requestId/approve', (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Роль обязательна' });
    }
    const result = db.approveAccessRequest(req.params.id, req.params.requestId, role);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    broadcastProjectUpdate(req.params.id, {
      type: 'members_updated',
      projectId: req.params.id,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin rejects an access request
app.post('/api/projects/:id/requests/:requestId/reject', (req, res) => {
  try {
    const result = db.rejectAccessRequest(req.params.id, req.params.requestId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true });
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
