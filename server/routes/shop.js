// Avatar shop. Coins-only currency (no real-money payments — school platform).

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { spendCoins } = require('../services/xpService');

const router = express.Router();

// GET /api/shop  - browse
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { priceCoins: 'asc' }],
    });
    const owned = await prisma.userInventoryItem.findMany({
      where: { userId: req.user.id },
      select: { itemId: true, isEquipped: true },
    });
    const ownedMap = new Map(owned.map((o) => [o.itemId, o]));
    res.json(
      items.map((it) => ({
        ...it,
        owned: ownedMap.has(it.id),
        equipped: ownedMap.get(it.id)?.isEquipped || false,
      })),
    );
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

// POST /api/shop/buy  { itemId }
router.post('/buy', authenticate, async (req, res) => {
  try {
    const itemId = String(req.body?.itemId || '');
    if (!itemId) return res.status(400).json({ error: 'itemId required' });
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item || !item.isActive) return res.status(404).json({ error: 'Item not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (item.unlockLevel && (user.level || 0) < item.unlockLevel) {
      return res.status(403).json({ error: `Reach level ${item.unlockLevel} first` });
    }

    const owned = await prisma.userInventoryItem.findUnique({
      where: { userId_itemId: { userId: req.user.id, itemId } },
    });
    if (owned) return res.status(409).json({ error: 'Already owned' });

    try {
      await spendCoins({
        userId: req.user.id,
        amount: item.priceCoins,
        source: 'shop_purchase',
        refId: item.id,
      });
    } catch (e) {
      if (String(e.message).includes('INSUFFICIENT_COINS')) {
        return res.status(402).json({ error: 'Not enough coins' });
      }
      throw e;
    }

    const inv = await prisma.userInventoryItem.create({
      data: { userId: req.user.id, itemId, isEquipped: false },
    });
    res.json({ ok: true, inventoryId: inv.id });
  } catch (e) {
    console.error('shop buy error', e);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// POST /api/shop/equip  { itemId }
router.post('/equip', authenticate, async (req, res) => {
  try {
    const itemId = String(req.body?.itemId || '');
    const inv = await prisma.userInventoryItem.findUnique({
      where: { userId_itemId: { userId: req.user.id, itemId } },
      include: { item: true },
    });
    if (!inv) return res.status(404).json({ error: 'Not owned' });

    // Unequip any other items in the same category, equip this one
    await prisma.$transaction(async (tx) => {
      await tx.userInventoryItem.updateMany({
        where: { userId: req.user.id, item: { category: inv.item.category } },
        data: { isEquipped: false },
      });
      await tx.userInventoryItem.update({
        where: { id: inv.id },
        data: { isEquipped: true },
      });
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Equip failed' });
  }
});

// GET /api/shop/inventory
router.get('/inventory', authenticate, async (req, res) => {
  try {
    const items = await prisma.userInventoryItem.findMany({
      where: { userId: req.user.id },
      include: { item: true },
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

module.exports = router;
