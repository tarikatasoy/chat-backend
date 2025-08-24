import db from "./models/index.js";
await db.sequelize.authenticate();

for (const [name, model] of Object.entries(db)) {
  if (!model.findAll) continue; // sequelize & Sequelize anahtarlarını atla
  const rows = await model.findAll({ raw: true, limit: 20 });
  console.log("=== " + name + " ===");
  console.table(rows);
}

await db.sequelize.close();
