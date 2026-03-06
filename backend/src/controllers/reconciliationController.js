const prisma = require('../config/prisma');
const reconciliationService = require('../services/reconciliationService');
const auditService = require('../services/auditService');

exports.runDaily = async (req, res, next) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const result = await reconciliationService.runDailyReconciliation(req.user.id, date);
    res.json({ reconciliation: result });
  } catch (error) {
    next(error);
  }
};

exports.getByDate = async (req, res, next) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const recon = await prisma.reconciliation.findFirst({
      where: { ownerId: req.user.id, date },
    });

    if (!recon) return res.status(404).json({ error: 'No reconciliation for this date' });
    res.json({ reconciliation: recon });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, flaggedOnly } = req.query;
    const p = parseInt(page);
    const l = parseInt(limit);
    const where = { ownerId: req.user.id };
    if (flaggedOnly === 'true') where.hasDiscrepancy = true;

    const [total, reconciliations] = await Promise.all([
      prisma.reconciliation.count({ where }),
      prisma.reconciliation.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    res.json({
      reconciliations,
      pagination: { total, page: p, totalPages: Math.ceil(total / l) },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const result = await auditService.getAuditLogs(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
