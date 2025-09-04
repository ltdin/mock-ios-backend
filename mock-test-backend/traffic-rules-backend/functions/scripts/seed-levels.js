// Chạy trên Emulator: đặt env FIRESTORE_EMULATOR_HOST=localhost:8080 rồi node scripts/seed-levels.js
const admin = require("firebase-admin");

// Dùng default credentials (Emulator không yêu cầu service account)
if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const LEVELS = [
  { levelId: "e1", difficulty: "easy",   order: 1 },
  { levelId: "e2", difficulty: "easy",   order: 2 },
  { levelId: "e3", difficulty: "easy",   order: 3 },

  { levelId: "m1", difficulty: "medium", order: 4 },
  { levelId: "m2", difficulty: "medium", order: 5 },
  { levelId: "m3", difficulty: "medium", order: 6 },
  
  { levelId: "h1", difficulty: "hard",   order: 7 },
  { levelId: "h2", difficulty: "hard",   order: 8 },
  { levelId: "h3", difficulty: "hard",   order: 9 }
];

(async () => {
  try {
    const batch = db.batch();
    for (const lv of LEVELS) {
      const ref = db.collection("levels").doc(lv.levelId);
      batch.set(ref, lv, { merge: true });
    }
    await batch.commit();
    console.log("Seeded levels:", LEVELS.map(l => l.levelId).join(", "));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
