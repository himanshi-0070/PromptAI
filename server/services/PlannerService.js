'use strict';

const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// Application Type Catalogue
// Maps detected app type → intelligent defaults for pages, routes, APIs, models
// ─────────────────────────────────────────────────────────────────────────────
const APP_CATALOGUE = {
  ecommerce: {
    name: 'E-Commerce Platform',
    pages: ['Home', 'ProductListing', 'ProductDetail', 'Cart', 'Checkout', 'OrderHistory', 'Profile'],
    routes: ['/', '/products', '/products/:id', '/cart', '/checkout', '/orders', '/profile'],
    apis: [
      'GET /api/products', 'GET /api/products/:id', 'POST /api/orders',
      'GET /api/orders', 'GET /api/cart', 'POST /api/cart', 'DELETE /api/cart/:id',
    ],
    models: ['Product', 'Order', 'User', 'Cart', 'Review'],
    components: ['Navbar', 'Footer', 'ProductCard', 'CartItem', 'CheckoutForm', 'OrderCard', 'StarRating'],
    features: ['Product search & filter', 'Shopping cart', 'Checkout flow', 'Order history', 'User authentication'],
    requiresAuth: true,
  },
  social: {
    name: 'Social Platform',
    pages: ['Feed', 'Profile', 'PostDetail', 'Explore', 'Notifications', 'Followers'],
    routes: ['/', '/profile/:id', '/post/:id', '/explore', '/notifications'],
    apis: [
      'GET /api/posts', 'POST /api/posts', 'DELETE /api/posts/:id',
      'POST /api/posts/:id/like', 'POST /api/posts/:id/comment',
      'GET /api/users/:id', 'POST /api/users/:id/follow',
    ],
    models: ['Post', 'User', 'Comment', 'Like', 'Follow'],
    components: ['PostCard', 'UserAvatar', 'CommentSection', 'LikeButton', 'Navbar', 'Sidebar', 'Stories'],
    features: ['Post feed', 'Like & comment', 'Follow system', 'User profiles', 'Notifications'],
    requiresAuth: true,
  },
  dashboard: {
    name: 'Analytics Dashboard',
    pages: ['Dashboard', 'Reports', 'Settings', 'DataTable', 'UserManagement'],
    routes: ['/', '/reports', '/settings', '/data', '/users'],
    apis: [
      'GET /api/metrics', 'GET /api/reports', 'GET /api/users',
      'DELETE /api/users/:id', 'PUT /api/users/:id',
    ],
    models: ['Metric', 'Report', 'User', 'Activity'],
    components: ['StatCard', 'LineChart', 'BarChart', 'DataTable', 'Sidebar', 'Navbar', 'DatePicker'],
    features: ['Real-time metrics', 'Charts & graphs', 'Data tables', 'Export reports', 'User management'],
    requiresAuth: true,
  },
  portfolio: {
    name: 'Portfolio Website',
    pages: ['Home', 'About', 'Projects', 'ProjectDetail', 'Skills', 'Contact'],
    routes: ['/', '/about', '/projects', '/projects/:id', '/contact'],
    apis: [
      'GET /api/projects', 'GET /api/projects/:id',
      'POST /api/contact', 'GET /api/skills',
    ],
    models: ['Project', 'Skill', 'ContactMessage'],
    components: ['HeroSection', 'ProjectCard', 'SkillBadge', 'ContactForm', 'Navbar', 'Footer', 'Timeline'],
    features: ['Project showcase', 'Skills section', 'Contact form', 'Animated hero', 'Responsive design'],
    requiresAuth: false,
  },
  blog: {
    name: 'Blog Platform',
    pages: ['Home', 'PostList', 'PostDetail', 'Category', 'AuthorProfile', 'Dashboard'],
    routes: ['/', '/posts', '/posts/:slug', '/category/:name', '/author/:id', '/admin'],
    apis: [
      'GET /api/posts', 'GET /api/posts/:slug', 'POST /api/posts',
      'PUT /api/posts/:id', 'DELETE /api/posts/:id',
      'GET /api/categories', 'POST /api/comments',
    ],
    models: ['Post', 'User', 'Category', 'Comment', 'Tag'],
    components: ['PostCard', 'BlogPost', 'CommentSection', 'CategoryBadge', 'AuthorCard', 'Navbar', 'Sidebar'],
    features: ['Rich text posts', 'Categories & tags', 'Comments', 'Author profiles', 'Search'],
    requiresAuth: true,
  },
  todo: {
    name: 'Task Manager',
    pages: ['Dashboard', 'BoardView', 'ListView', 'TaskDetail', 'Settings'],
    routes: ['/', '/board', '/list', '/task/:id', '/settings'],
    apis: [
      'GET /api/tasks', 'POST /api/tasks', 'PUT /api/tasks/:id',
      'DELETE /api/tasks/:id', 'PATCH /api/tasks/:id/status',
      'GET /api/projects', 'POST /api/projects',
    ],
    models: ['Task', 'Project', 'User', 'Label'],
    components: ['TaskCard', 'KanbanBoard', 'Column', 'AddTaskForm', 'PriorityBadge', 'Navbar', 'Sidebar'],
    features: ['Kanban board', 'Task priorities', 'Due dates', 'Labels', 'Drag and drop'],
    requiresAuth: true,
  },
  restaurant: {
    name: 'Restaurant App',
    pages: ['Home', 'Menu', 'MenuItemDetail', 'Cart', 'Checkout', 'OrderTracking', 'About'],
    routes: ['/', '/menu', '/menu/:id', '/cart', '/checkout', '/order/:id', '/about'],
    apis: [
      'GET /api/menu', 'GET /api/menu/:id', 'GET /api/categories',
      'POST /api/orders', 'GET /api/orders/:id',
    ],
    models: ['MenuItem', 'Category', 'Order', 'User', 'Review'],
    components: ['MenuCard', 'CategoryFilter', 'CartDrawer', 'OrderSummary', 'Navbar', 'HeroSection', 'ReviewCard'],
    features: ['Menu browsing', 'Category filter', 'Cart & checkout', 'Order tracking', 'Reviews'],
    requiresAuth: false,
  },
  booking: {
    name: 'Booking System',
    pages: ['Home', 'Services', 'BookingForm', 'Confirmation', 'MyBookings', 'Dashboard'],
    routes: ['/', '/services', '/book/:serviceId', '/confirm/:id', '/bookings', '/admin'],
    apis: [
      'GET /api/services', 'GET /api/availability',
      'POST /api/bookings', 'GET /api/bookings', 'DELETE /api/bookings/:id',
    ],
    models: ['Service', 'Booking', 'User', 'TimeSlot', 'Availability'],
    components: ['ServiceCard', 'Calendar', 'TimeSlotPicker', 'BookingForm', 'Navbar', 'Footer', 'BookingCard'],
    features: ['Service listing', 'Real-time availability', 'Booking form', 'Confirmation email', 'My bookings'],
    requiresAuth: true,
  },
  chat: {
    name: 'Chat Application',
    pages: ['Home', 'ChatRoom', 'DirectMessage', 'Contacts', 'Settings'],
    routes: ['/', '/chat/:roomId', '/dm/:userId', '/contacts', '/settings'],
    apis: [
      'GET /api/rooms', 'POST /api/rooms', 'GET /api/messages/:roomId',
      'POST /api/messages', 'GET /api/contacts', 'POST /api/contacts',
    ],
    models: ['Message', 'Room', 'User', 'Participant'],
    components: ['MessageBubble', 'ChatInput', 'RoomList', 'ContactList', 'Navbar', 'UserStatus', 'MessageList'],
    features: ['Real-time messaging', 'Group rooms', 'Direct messages', 'Contact list', 'Message history'],
    requiresAuth: true,
  },
  finance: {
    name: 'Finance Tracker',
    pages: ['Dashboard', 'Transactions', 'Budget', 'Reports', 'Accounts', 'Settings'],
    routes: ['/', '/transactions', '/budget', '/reports', '/accounts', '/settings'],
    apis: [
      'GET /api/transactions', 'POST /api/transactions', 'DELETE /api/transactions/:id',
      'GET /api/budgets', 'POST /api/budgets', 'GET /api/accounts',
      'GET /api/reports/monthly',
    ],
    models: ['Transaction', 'Budget', 'Account', 'User', 'Category'],
    components: ['TransactionCard', 'BudgetBar', 'ExpenseChart', 'AccountCard', 'Navbar', 'Sidebar', 'DateFilter'],
    features: ['Expense tracking', 'Budget management', 'Financial reports', 'Account overview', 'Categories'],
    requiresAuth: true,
  },
  saas: {
    name: 'SaaS Platform',
    pages: ['Landing', 'Features', 'Pricing', 'Dashboard', 'Settings', 'Billing'],
    routes: ['/', '/features', '/pricing', '/dashboard', '/settings', '/billing'],
    apis: [
      'GET /api/subscription', 'POST /api/subscription', 'GET /api/features',
      'GET /api/billing', 'POST /api/auth/register', 'POST /api/auth/login',
    ],
    models: ['User', 'Subscription', 'Plan', 'Invoice', 'Feature'],
    components: ['PricingCard', 'FeatureItem', 'Navbar', 'HeroSection', 'Testimonial', 'Footer', 'DashboardStats'],
    features: ['Landing page', 'Pricing tiers', 'User dashboard', 'Billing management', 'Feature showcase'],
    requiresAuth: true,
  },
  'web-application': {
    name: 'Web Application',
    pages: ['Home', 'Dashboard', 'Settings', 'Profile'],
    routes: ['/', '/dashboard', '/settings', '/profile'],
    apis: ['GET /api/data', 'POST /api/data', 'PUT /api/data/:id', 'DELETE /api/data/:id'],
    models: ['User', 'Data'],
    components: ['Navbar', 'Footer', 'Card', 'Button', 'Modal', 'Form'],
    features: ['User authentication', 'Data management', 'Responsive design', 'Settings panel'],
    requiresAuth: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PlannerService
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PlannerService — Stages 1–6 of the AI Generation Pipeline.
 *
 * Transforms a natural language user prompt into a fully structured
 * ProjectSpecification object. Acts like a Senior Software Architect.
 *
 * This service NEVER generates source code.
 * It only produces structured plans that feed into PromptBuilderService.
 *
 * Stages:
 *   1 — Intent Analysis    (what type of app + high-level constraints)
 *   2 — Requirement Extraction (features, UI requirements, integrations)
 *   3 — Stack Planning     (frontend + backend + database tech decisions)
 *   4 — Technology Planning (npm dependencies per environment)
 *   5 — Architecture Planning (pages, routes, APIs, models, components)
 *   6 — Folder Structure Planning (directory layout)
 */
class PlannerService {

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Analyzes a user prompt and produces a complete ProjectSpecification.
   * For incremental updates, enriches the spec with existing project context.
   *
   * @param {string} userPrompt - The raw user description.
   * @param {object|null} existingProject - MongoDB project record for chat updates.
   * @returns {ProjectSpecification}
   */
  analyze(userPrompt, existingProject = null) {
    logger.info('[PlannerService] Stage 1: Analyzing intent...');
    const intent = this._analyzeIntent(userPrompt);

    logger.info(`[PlannerService] Stage 2: Detected app type: "${intent.appType}". Extracting requirements...`);
    const requirements = this._extractRequirements(userPrompt, intent);

    logger.info('[PlannerService] Stage 3: Planning technology stack...');
    const stack = this._planStack(userPrompt, intent);

    logger.info('[PlannerService] Stage 4: Planning dependencies...');
    const technologies = this._planTechnologies(userPrompt, intent, requirements);

    logger.info('[PlannerService] Stage 5: Planning architecture...');
    const architecture = this._planArchitecture(userPrompt, intent, requirements);

    logger.info('[PlannerService] Stage 6: Planning folder structure...');
    const folderPlan = this._planFolders(intent, architecture, requirements);

    const spec = {
      // Metadata
      applicationName: this._deriveAppName(userPrompt, intent),
      appType: intent.appType,
      originalPrompt: userPrompt,
      isIncremental: Boolean(existingProject),
      existingProject: existingProject || null,

      // Planning output by stage
      intent,
      requirements,
      stack,
      technologies,
      architecture,
      folderPlan,
    };

    logger.info(`[PlannerService] Specification complete. App: "${spec.applicationName}", Pages: ${architecture.pages.length}, APIs: ${architecture.apis.length}`);
    return spec;
  }

  // ── Stage 1 — Intent Analysis ──────────────────────────────────────────────

  _analyzeIntent(prompt) {
    const lower = prompt.toLowerCase();

    const appTypeMap = {
      ecommerce:  ['shop', 'store', 'ecommerce', 'e-commerce', 'cart', 'product', 'buy', 'sell', 'marketplace', 'checkout'],
      social:     ['social', 'feed', 'follow', 'like', 'comment', 'network', 'community'],
      dashboard:  ['dashboard', 'analytics', 'chart', 'metric', 'report', 'admin panel', 'kpi'],
      portfolio:  ['portfolio', 'resume', 'cv', 'showcase', 'about me', 'personal site'],
      blog:       ['blog', 'article', 'cms', 'content management', 'publication', 'editorial'],
      todo:       ['todo', 'task manager', 'kanban', 'productivity', 'to-do', 'project manager'],
      restaurant: ['restaurant', 'food delivery', 'menu', 'cuisine', 'diner', 'takeout', 'cafe'],
      booking:    ['booking', 'reservation', 'appointment', 'schedule', 'calendar', 'availability'],
      chat:       ['chat', 'messaging', 'messenger', 'conversation', 'realtime chat', 'slack'],
      finance:    ['finance', 'expense', 'budget', 'transaction', 'spending', 'money tracker', 'accounting'],
      saas:       ['saas', 'subscription', 'pricing', 'landing page', 'startup', 'platform'],
    };

    let appType = 'web-application';
    let highestScore = 0;
    for (const [type, keywords] of Object.entries(appTypeMap)) {
      const score = keywords.filter((kw) => lower.includes(kw)).length;
      if (score > highestScore) {
        highestScore = score;
        appType = type;
      }
    }

    const catalogue = APP_CATALOGUE[appType] || APP_CATALOGUE['web-application'];

    return {
      appType,
      isFullStack: true,
      requiresAuth: catalogue.requiresAuth ||
        lower.includes('auth') || lower.includes('login') ||
        lower.includes('register') || lower.includes('user account'),
      requiresDatabase: true,
      requiresAPI: true,
      requiresRealtime: lower.includes('realtime') || lower.includes('real-time') ||
        lower.includes('live') || lower.includes('socket'),
    };
  }

  // ── Stage 2 — Requirement Extraction ──────────────────────────────────────

  _extractRequirements(prompt, intent) {
    const lower = prompt.toLowerCase();

    return {
      // UI
      theme: lower.includes('dark') ? 'dark' : lower.includes('light') ? 'light' : 'dark',
      responsive: true,
      animations: true,
      premiumDesign: true,

      // Features inferred from prompt
      authentication: intent.requiresAuth,
      fileUpload: lower.includes('upload') || lower.includes('image') || lower.includes('photo'),
      realtime: intent.requiresRealtime,
      payments: lower.includes('payment') || lower.includes('stripe') || lower.includes('paypal'),
      search: lower.includes('search') || lower.includes('filter'),
      pagination: true,
      emailNotifications: lower.includes('email') || lower.includes('notification'),
      adminPanel: lower.includes('admin') || lower.includes('management'),

      // Explicit mentions
      explicitMentions: {
        tailwind: !lower.includes('bootstrap') && !lower.includes('material ui'),
        framerMotion: lower.includes('animation') || lower.includes('motion') || true,
        reactIcons: true,
      },
    };
  }

  // ── Stage 3 — Stack Planning ───────────────────────────────────────────────

  _planStack(_prompt, _intent) {
    return {
      frontend: {
        framework: 'React 18',
        bundler: 'Vite',
        styling: 'Tailwind CSS',
        router: 'react-router-dom v6',
        stateManagement: 'React Context + useState',
        httpClient: 'Axios',
        animations: 'Framer Motion',
      },
      backend: {
        runtime: 'Node.js',
        framework: 'Express.js',
        architecture: 'Service-Oriented (Controllers → Services → Models)',
        validation: 'express-validator',
      },
      database: {
        primary: 'MongoDB',
        orm: 'Mongoose',
      },
    };
  }

  // ── Stage 4 — Technology Planning ─────────────────────────────────────────

  _planTechnologies(prompt, intent, requirements) {

    const frontend = [
      'react', 'react-dom', 'react-router-dom',
      'axios', 'framer-motion',
      'lucide-react',
    ];

    const backend = [
      'express', 'mongoose', 'cors', 'helmet',
      'dotenv', 'uuid', 'morgan',
      'express-validator',
    ];

    // Auth dependencies
    if (requirements.authentication) {
      backend.push('jsonwebtoken', 'bcryptjs');
    }

    // File upload
    if (requirements.fileUpload) {
      backend.push('multer');
    }

    // Payments
    if (requirements.payments) {
      backend.push('stripe');
    }

    // Realtime
    if (requirements.realtime) {
      backend.push('socket.io');
      frontend.push('socket.io-client');
    }

    // Email
    if (requirements.emailNotifications) {
      backend.push('nodemailer');
    }

    return {
      frontend: [...new Set(frontend)],
      backend: [...new Set(backend)],
    };
  }

  // ── Stage 5 — Architecture Planning ───────────────────────────────────────

  _planArchitecture(prompt, intent, requirements) {
    const catalogue = APP_CATALOGUE[intent.appType] || APP_CATALOGUE['web-application'];

    // Merge catalogue defaults with prompt-specific overrides
    const pages = [...catalogue.pages];
    const routes = [...catalogue.routes];
    const apis = [...catalogue.apis];
    const models = [...catalogue.models];
    const components = [...catalogue.components];
    const features = [...catalogue.features];

    // Add auth pages if needed and not already present
    if (requirements.authentication && !pages.includes('Login')) {
      pages.push('Login', 'Register');
      routes.push('/login', '/register');
      apis.push('POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me');
      if (!models.includes('User')) models.push('User');
    }

    // Add search if requested
    if (requirements.search && !apis.some((a) => a.includes('search'))) {
      apis.push('GET /api/search');
    }

    return {
      pages: [...new Set(pages)],
      routes: [...new Set(routes)],
      apis: [...new Set(apis)],
      models: [...new Set(models)],
      components: [...new Set(components)],
      features: [...new Set(features)],
    };
  }

  // ── Stage 6 — Folder Planning ──────────────────────────────────────────────

  _planFolders(intent, architecture, requirements) {
    const base = [
      'frontend/src/components',
      'frontend/src/pages',
      'frontend/src/hooks',
      'frontend/src/context',
      'frontend/src/services',
      'frontend/src/utils',
      'frontend/src/assets',
      'frontend/public',
      'backend/src/controllers',
      'backend/src/routes',
      'backend/src/models',
      'backend/src/middleware',
      'backend/src/services',
      'backend/src/utils',
      'backend/config',
    ];

    if (requirements.authentication) {
      base.push('backend/src/middleware/auth');
    }

    if (requirements.fileUpload) {
      base.push('backend/src/uploads');
    }

    // Component subdirectories
    const componentGroups = ['layout', 'ui', 'common'];
    componentGroups.forEach((g) => base.push(`frontend/src/components/${g}`));

    return [...new Set(base)];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Derives a human-readable application name from the user prompt.
   * Extracts proper nouns or generates from app type if none found.
   */
  _deriveAppName(prompt, intent) {
    // Try to extract quoted name first
    const quotedMatch = prompt.match(/["']([A-Z][^"']{1,40})["']/);
    if (quotedMatch) return quotedMatch[1];

    // Try to find "called X" or "named X" or "for X"
    const calledMatch = prompt.match(/(?:called|named|for)\s+([A-Z][a-zA-Z0-9\s]{1,30})/i);
    if (calledMatch) return calledMatch[1].trim();

    // Fall back to catalogue default
    const catalogue = APP_CATALOGUE[intent.appType] || APP_CATALOGUE['web-application'];
    return catalogue.name;
  }
}

module.exports = new PlannerService();
