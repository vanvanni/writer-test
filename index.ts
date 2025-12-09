import { readdir, unlink } from 'fs/promises';
import { join } from 'path';

const STORAGE_DIR = './storage';
const SNAPSHOTS_DIR = './storage/snapshots';
const COUNT_FILE = './storage/count.json';
const GENERATION_FILE = './storage/generation.json';
const MAX_COUNT = 2500;

interface CountData {
  count: number;
  lastUpdated: string;
}

interface Snapshot {
  count: number;
  timestamp: string;
}

interface Generation {
  generation: number;
  lastReset: string;
}

async function ensureDirectories() {
  try {
    await Bun.write(`${SNAPSHOTS_DIR}/.keep`, '');
  } catch {}
}

async function getGeneration(): Promise<number> {
  try {
    const file = Bun.file(GENERATION_FILE);
    if (await file.exists()) {
      const data = await file.json() as Generation;
      return data.generation;
    }
  } catch {}
  return 0;
}

async function incrementGeneration(): Promise<number> {
  const current = await getGeneration();
  const next = current + 1;
  const data: Generation = {
    generation: next,
    lastReset: new Date().toISOString()
  };
  await Bun.write(GENERATION_FILE, JSON.stringify(data, null, 2));
  return next;
}

async function deleteAllFiles() {
  try {
    if (await Bun.file(COUNT_FILE).exists()) {
      await Bun.write(COUNT_FILE, '{}');
    }
    
    const entries = await readdir(SNAPSHOTS_DIR);
    for (const entry of entries) {
      if (entry.startsWith('snapshot-') && entry.endsWith('.json')) {
        try {
          await unlink(join(SNAPSHOTS_DIR, entry));
        } catch {}
      }
    }
  } catch {}
}

async function initCount(): Promise<CountData> {
  try {
    const file = Bun.file(COUNT_FILE);
    if (await file.exists()) {
      const data = await file.json() as CountData;
      return data;
    }
  } catch {}
  
  const initial: CountData = { count: 0, lastUpdated: new Date().toISOString() };
  await Bun.write(COUNT_FILE, JSON.stringify(initial, null, 2));
  return initial;
}

async function updateCount(current: CountData): Promise<CountData> {
  const updated: CountData = {
    count: current.count + 1,
    lastUpdated: new Date().toISOString()
  };
  
  await Bun.write(COUNT_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

async function createSnapshot(count: number) {
  const snapshot: Snapshot = {
    count,
    timestamp: new Date().toISOString()
  };
  
  const filename = `${SNAPSHOTS_DIR}/snapshot-${Date.now()}.json`;
  await Bun.write(filename, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot: ${filename} (count: ${count})`);
}

function randomInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function startCounter() {
  await ensureDirectories();
  const generation = await getGeneration();
  let countData = await initCount();
  
  console.log(`Generation ${generation} - Starting counter from ${countData.count} to ${MAX_COUNT}`);
  
  const updateCounter = async () => {
    if (countData.count < MAX_COUNT) {
      countData = await updateCount(countData);
      console.log(`Count: ${countData.count}`);
      setTimeout(updateCounter, randomInterval(100, 320));
    } else {
      console.log(`Reached max count of ${MAX_COUNT}`);
      await deleteAllFiles();
      const newGeneration = await incrementGeneration();
      console.log(`Restarting - Generation ${newGeneration}`);
      setTimeout(startCounter, 100);
    }
  };
  
  const takeSnapshot = async () => {
    if (countData.count < MAX_COUNT) {
      await createSnapshot(countData.count);
      setTimeout(takeSnapshot, randomInterval(6000, 12000));
    }
  };
  
  updateCounter();
  takeSnapshot();
}

startCounter().catch(console.error);
