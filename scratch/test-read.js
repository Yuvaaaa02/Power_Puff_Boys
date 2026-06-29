const fs = require('fs');
const path = require('path');

// Mock process.cwd() and process.env.VERCEL
process.env.VERCEL = undefined;

// We need to resolve the module. Since it is TS, we can mock ensureDataFile and readExpenses
function resolveDataFilePath(filename) {
  return path.join(process.cwd(), "data", filename);
}

async function ensureDataFile(filename, defaultData) {
  const targetFile = resolveDataFilePath(filename);
  const dataDir = path.dirname(targetFile);
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(targetFile)) {
    fs.writeFileSync(targetFile, defaultData, "utf8");
  }
  return targetFile;
}

const crypto = require('crypto');

async function readExpenses() {
  const file = await ensureDataFile("expenses.json", "[]");
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  
  let modified = false;
  const upgraded = data.map(exp => {
    if (!exp.id) {
      exp.id = crypto.randomUUID();
      modified = true;
    }
    return exp;
  });
  
  if (modified) {
    fs.writeFileSync(file, JSON.stringify(upgraded, null, 2), "utf8");
  }
  
  return upgraded;
}

async function run() {
  const file = resolveDataFilePath("expenses.json");
  
  // Write an expense with NO id
  const initialData = [
    {
      date: "2026-06-29",
      section: "afternoon",
      paidBy: "Yuvaraj",
      totalAmount: 100,
      splitAmong: ["Yuvaraj", "Anand"],
      splitAmount: 50,
      description: "Test"
    }
  ];
  fs.writeFileSync(file, JSON.stringify(initialData, null, 2), 'utf8');
  console.log("Written initial data (no ID).");
  console.log("File content:", fs.readFileSync(file, 'utf8'));

  // Call readExpenses
  const read1 = await readExpenses();
  console.log("Read 1 return value:", read1);
  console.log("File content after Read 1:", fs.readFileSync(file, 'utf8'));

  // Call readExpenses again
  const read2 = await readExpenses();
  console.log("Read 2 return value:", read2);
  console.log("File content after Read 2:", fs.readFileSync(file, 'utf8'));
}

run().catch(console.error);
