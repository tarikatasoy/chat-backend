// models/index.js  –  tamamen ESM uyumlu
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Sequelize } from "sequelize";
import process from "process";

// --------------------------------------------------
// __dirname / __filename emülasyonu
// --------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// --------------------------------------------------
// Config – dilersen .env üzerinden JS dosyası kullan
// --------------------------------------------------
import configObj from "../config/config.js";   // ← az sonra anlatılıyor
const env      = process.env.NODE_ENV || "development";
const config   = configObj[env];

const db       = {};
const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config.database, config.username, config.password, config);

// --------------------------------------------------
// Modelleri dinamik yükle (ESM import)
// --------------------------------------------------
const modelFiles = fs.readdirSync(__dirname).filter(
  (file) =>
    file.endsWith(".js") &&
    file !== path.basename(__filename) &&
    !file.endsWith(".test.js")
);

for (const file of modelFiles) {
  // Windows’ta “C:\…” yolu →  file:// URL’ine çevrilir
  const fileUrl = pathToFileURL(path.join(__dirname, file)).href;
  const { default: defineModel } = await import(fileUrl);
  const model = defineModel(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// İlişkileri çalıştır
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) db[modelName].associate(db);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;                   // server.js -> import db from ...
export { sequelize, Sequelize };     // opsiyonel named export
