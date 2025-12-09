const STORAGE_DIR = './storage';
const SNAPSHOTS_DIR = './storage/snapshots';
const COUNT_FILE = './storage/count.json';
const MAX_COUNT = 2500;

interface CountData {
  count: number;
  lastUpdated: string;
}

interface Snapshot {
  count: number;
  timestamp: string;
}

async function ensureDirectories() {
  try {
    await Bun.write(`${SNAPSHOTS_DIR}/.keep`, '');
  } catch {}
}

async function initCount(): Promise<CountData> {
  try {
    const file = Bun.file(COUNT_FILE);
    if (await file.exists()) {
      const data = await file.json() as CountData;
      return data.count >= MAX_COUNT 
        ? { count: MAX_COUNT, lastUpdated: new Date().toISOString() } 
        : data;
    }
  } catch {}
  
  const initial: CountData = { count: 0, lastUpdated: new Date().toISOString() };
  await Bun.write(COUNT_FILE, JSON.stringify(initial, null, 2));
  return initial;
}

async function updateCount(current: CountData): Promise<CountData> {
  if (current.count >= MAX_COUNT) return current;
  
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

async function main() {
  await ensureDirectories();
  let countData = await initCount();
  
  console.log(`Starting counter from ${countData.count} to ${MAX_COUNT}`);
  
  const updateCounter = async () => {
    if (countData.count < MAX_COUNT) {
      countData = await updateCount(countData);
      console.log(`Count: ${countData.count}`);
      setTimeout(updateCounter, randomInterval(300, 1200));
    } else {
      console.log(`Reached max count of ${MAX_COUNT}`);
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

main().catch(console.error);
