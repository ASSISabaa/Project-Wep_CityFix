// server/routes/teams.js
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Report = require('../models/Report'); // optional, used for casesAssigned when available

const router = express.Router();

const requireAuth = (req, res, next) => {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Forbidden' });
};

function normalizeUser(u) {
  const name = u.fullName || u.name || u.username || '';
  const roleTitle = u.roleTitle || u.role || u.position || 'Member';
  const department =
    (u.profile && (u.profile.department || u.profile.dept)) ||
    u.department ||
    'General';
  const status =
    (u.presence && u.presence.status) ||
    u.status ||
    (u.isActive ? 'active' : 'offline') ||
    'offline';

  const lastActiveAt = u.lastLoginAt || u.lastActiveAt || u.updatedAt || u.createdAt;
  return {
    _id: u._id,
    name,
    roleTitle,
    department,
    status,
    email: u.email || '',
    phone: u.phone || '',
    avatarUrl: u.avatarUrl || u.avatar || '',
    casesAssigned: u.casesAssigned ?? 0,
    lastActiveAt,
    isActive: u.isActive !== false
  };
}

function baseMatch({ department, status, roles }) {
  const m = { };
  if (roles && roles.length) m.role = { $in: roles };
  if (department) m.$or = [
    { department },
    { 'profile.department': department },
    { 'profile.dept': department }
  ];
  if (status) m.$or = [
    { status },
    { 'presence.status': status }
  ];
  return m;
}

function textMatch(search) {
  if (!search) return null;
  const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { fullName: rx }, { name: rx }, { username: rx },
      { email: rx }, { role: rx }, { roleTitle: rx },
      { department: rx }, { 'profile.department': rx }, { 'profile.dept': rx }
    ]
  };
}

async function aggregateUsers({ search, department, status, page, limit, sort, roles }) {
  const match = baseMatch({ department, status, roles });
  const text = textMatch(search);
  if (text) Object.assign(match, text);

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'reports',
        let: { uid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$assignedTo', '$$uid'] },
                  { $eq: ['$userId', '$$uid'] }
                ]
              }
            }
          },
          { $count: 'cnt' }
        ],
        as: 'reportsAgg'
      }
    },
    {
      $addFields: {
        casesAssigned: { $ifNull: [{ $arrayElemAt: ['$reportsAgg.cnt', 0] }, 0] }
      }
    },
    { $project: { reportsAgg: 0 } }
  ];

  const sortObj = {};
  if (sort) {
    const parts = String(sort).split(',');
    for (const p of parts) {
      const s = p.trim();
      if (!s) continue;
      if (s.startsWith('-')) sortObj[s.slice(1)] = -1;
      else sortObj[s] = 1;
    }
  } else {
    sortObj.lastLoginAt = -1;
    sortObj.updatedAt = -1;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const facet = await User.aggregate([
    ...pipeline,
    {
      $facet: {
        items: [
          { $sort: sortObj },
          { $skip: skip },
          { $limit: Number(limit) }
        ],
        meta: [{ $count: 'total' }]
      }
    }
  ]);

  const items = (facet[0]?.items || []).map(normalizeUser);
  const total = facet[0]?.meta?.[0]?.total || 0;
  return { items, total };
}

router.get('/stats', requireAuth, async (req, res) => {
  const roles = req.query.roles ? req.query.roles.split(',') : ['admin', 'team'];
  const base = baseMatch({ roles });
  const [totalUsers, activeUsers, departmentsDistinct] = await Promise.all([
    User.countDocuments(base),
    User.countDocuments({ ...base, $or: [{ status: 'active' }, { 'presence.status': 'active' }] }),
    User.distinct('department', base)
  ]);

  const availabilityRate = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0;

  res.json({
    totalMembers: totalUsers,
    activeMembers: activeUsers,
    departmentsCount: departmentsDistinct.filter(Boolean).length,
    availabilityRate
  });
});

router.get('/members', requireAuth, async (req, res) => {
  const {
    search = '',
    department,
    status,
    page = 1,
    limit = 12,
    sort = '-lastLoginAt,-updatedAt',
    roles = 'admin,team'
  } = req.query;

  const rolesArr = String(roles)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const { items, total } = await aggregateUsers({
    search,
    department,
    status,
    page,
    limit,
    sort,
    roles: rolesArr
  });

  res.json({
    items,
    page: Number(page),
    total,
    totalPages: Math.ceil(total / Number(limit))
  });
});

router.get('/members/:id', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const u = await User.findById(req.params.id).lean();
  if (!u) return res.status(404).json({ message: 'Not found' });

  const count = await Report.countDocuments({
    $or: [{ assignedTo: u._id }, { userId: u._id }]
  });

  res.json(
    normalizeUser({
      ...u,
      casesAssigned: count
    })
  );
});

/* Optional admin endpoints to set role/department/status for a user */
router.patch('/members/:id', requireAuth, requireAdmin, async (req, res) => {
  const allowed = ['fullName','name','username','email','phone','role','roleTitle','department','status','avatarUrl','profile','presence','isActive','lastLoginAt'];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];
  const u = await User.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
  if (!u) return res.status(404).json({ message: 'Not found' });
  res.json(normalizeUser(u));
});

module.exports = router;
