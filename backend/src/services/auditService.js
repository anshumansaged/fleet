const prisma = require('../config/prisma');

async function logAction({ ownerId, userId, action, entityType, entityId, previousData, newData, ipAddress }) {
  return prisma.auditLog.create({
    data: {
      ownerId,
      userId,
      action,
      entityType,
      entityId,
      previousData: previousData || undefined,
      newData: newData || undefined,
      ipAddress,
    },
  });
}

async function getAuditLogs(ownerId, { page = 1, limit = 50, entityType, entityId }) {
  const where = { ownerId };
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return { logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
}

module.exports = { logAction, getAuditLogs };
