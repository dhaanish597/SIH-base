/* eslint-disable no-console */
// Seeds reference data: level definitions, badge definitions, default shop
// items, default quests. Idempotent.

require('dotenv').config();

const prisma = require('../server/lib/prisma');

const LEVELS = [
  { level: 1, title: 'Rookie', xp: 0 },
  { level: 5, title: 'Rookie', xp: 500 },
  { level: 10, title: 'Apprentice', xp: 1500 },
  { level: 15, title: 'Apprentice', xp: 3000 },
  { level: 20, title: 'Scholar', xp: 5000 },
  { level: 25, title: 'Scholar', xp: 8000 },
  { level: 30, title: 'Expert', xp: 12000 },
  { level: 35, title: 'Expert', xp: 17000 },
  { level: 40, title: 'Champion', xp: 23000 },
  { level: 45, title: 'Champion', xp: 30000 },
  { level: 50, title: 'Legend', xp: 40000 },
];

const BADGES = [
  { key: 'first_quiz', name: 'First Quiz', description: 'Completed your first quiz', type: 'MILESTONE' },
  { key: 'first_blood', name: 'First Blood', description: 'Won your first multiplayer match', type: 'GAME' },
  { key: 'speed_demon', name: 'Speed Demon', description: 'Fastest quiz finish in your school this week', type: 'GAME' },
  { key: 'streak_7', name: '7-Day Streak', description: 'Active 7 days in a row', type: 'STREAK', threshold: 7 },
  { key: 'streak_30', name: '30-Day Streak', description: 'Active 30 days in a row', type: 'STREAK', threshold: 30 },
  { key: 'streak_100', name: '100-Day Streak', description: 'Active 100 days in a row', type: 'STREAK', threshold: 100 },
  { key: 'helper', name: 'Helper', description: 'Helped a teammate in co-op', type: 'COLLAB' },
  { key: 'escape_artist', name: 'Escape Artist', description: 'Escaped a Science Lab with 3 stars', type: 'GAME' },
];

const QUESTS = [
  {
    key: 'daily_win_quizbattle',
    type: 'DAILY',
    title: 'Quiz Champion',
    description: 'Win 1 Quiz Battle today',
    goal: { kind: 'win_match', game: 'QUIZ_BATTLE', count: 1 },
    rewardXp: 100,
    rewardCoins: 25,
  },
  {
    key: 'daily_math_10',
    type: 'DAILY',
    title: 'Math Marathon',
    description: 'Answer 10 math questions correctly',
    goal: { kind: 'correct_answers', subject: 'Mathematics', count: 10 },
    rewardXp: 75,
    rewardCoins: 15,
  },
  {
    key: 'daily_play_any',
    type: 'DAILY',
    title: 'Daily Adventurer',
    description: 'Play any game today',
    goal: { kind: 'play_game', count: 1 },
    rewardXp: 50,
    rewardCoins: 10,
  },
  {
    key: 'weekly_escape_3star',
    type: 'WEEKLY',
    title: 'Escape Master',
    description: 'Escape any Science Lab with 3 stars',
    goal: { kind: 'escape_stars', game: 'SCIENCE_LAB', stars: 3, count: 1 },
    rewardXp: 500,
    rewardCoins: 150,
  },
];

const SHOP_ITEMS = [
  { key: 'avatar_cat', name: 'Cat Avatar', category: 'AVATAR', iconUrl: '/shop/avatar_cat.png', priceCoins: 50 },
  { key: 'avatar_dragon', name: 'Dragon Avatar', category: 'AVATAR', iconUrl: '/shop/avatar_dragon.png', priceCoins: 200, unlockLevel: 10 },
  { key: 'bg_galaxy', name: 'Galaxy Background', category: 'BACKGROUND', iconUrl: '/shop/bg_galaxy.png', priceCoins: 75 },
  { key: 'skin_red_hero', name: 'Crimson Hero', category: 'HERO_SKIN', iconUrl: '/shop/skin_red.png', priceCoins: 150 },
  { key: 'labcoat_gold', name: 'Gold Lab Coat', category: 'LAB_COAT', iconUrl: '/shop/lab_gold.png', priceCoins: 300, unlockLevel: 15 },
];

async function main() {
  for (const l of LEVELS) {
    await prisma.levelDefinition.upsert({
      where: { level: l.level },
      update: { title: l.title, xpRequired: l.xp },
      create: { level: l.level, title: l.title, xpRequired: l.xp },
    });
  }
  console.log(`✓ ${LEVELS.length} level rows`);

  for (const b of BADGES) {
    await prisma.badgeDefinition.upsert({
      where: { key: b.key },
      update: { name: b.name, description: b.description, type: b.type, threshold: b.threshold ?? null },
      create: { key: b.key, name: b.name, description: b.description, type: b.type, threshold: b.threshold ?? null },
    });
  }
  console.log(`✓ ${BADGES.length} badge definitions`);

  for (const q of QUESTS) {
    await prisma.quest.upsert({
      where: { key: q.key },
      update: { title: q.title, description: q.description, goal: q.goal, rewardXp: q.rewardXp, rewardCoins: q.rewardCoins, type: q.type },
      create: q,
    });
  }
  console.log(`✓ ${QUESTS.length} quests`);

  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { key: item.key },
      update: item,
      create: item,
    });
  }
  console.log(`✓ ${SHOP_ITEMS.length} shop items`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
