const prisma = require('../src/config/database');

(async () => {
  try {
    const bs = await prisma.business.findMany({ select: { id: true, name: true } });
    console.log('BUSINESSES:', JSON.stringify(bs, null, 2));
  } catch (e) {
    console.error('ERROR listing businesses:', e.message || e);
  } finally {
    await prisma.$disconnect();
  }
})();
