import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("inventory.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identification TEXT UNIQUE,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS warehouses (
    code TEXT PRIMARY KEY,
    description TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS user_warehouses (
    user_id INTEGER,
    warehouse_code TEXT,
    PRIMARY KEY (user_id, warehouse_code),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (warehouse_code) REFERENCES warehouses(code)
  );

  CREATE TABLE IF NOT EXISTS products (
    code TEXT PRIMARY KEY,
    description TEXT,
    inventory_unit TEXT,
    packaging_unit TEXT,
    conversion_factor INTEGER
  );

  CREATE TABLE IF NOT EXISTS inventory_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    count_number INTEGER CHECK(count_number IN (1, 2, 3)),
    cut_off_date TEXT,
    warehouse_code TEXT,
    product_code TEXT,
    quantity_packaging REAL,
    quantity_units REAL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_code) REFERENCES warehouses(code),
    FOREIGN KEY (product_code) REFERENCES products(code),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial data
const seedData = () => {
  const warehouseCount = db.prepare("SELECT COUNT(*) as count FROM warehouses").get() as { count: number };
  if (warehouseCount.count === 0) {
    const insertWH = db.prepare("INSERT INTO warehouses (code, description, status) VALUES (?, ?, ?)");
    insertWH.run("00009", "Cereté", "Activo");
    insertWH.run("00014", "Central", "Activo");
    insertWH.run("00006", "Valledupar", "Activo");
    insertWH.run("00090", "Maicao", "Inactivo por remodelaciones");

    const insertProd = db.prepare("INSERT INTO products (code, description, inventory_unit, packaging_unit, conversion_factor) VALUES (?, ?, ?, ?, ?)");
    insertProd.run("4779", "ATUN TRIPACK LA SOBERANA ACTE 80 GRM", "UND", "CAJA", 12);
    insertProd.run("4266", "HARINA AREPA REPA BLANCA 500G X24", "UND", "ARROBA", 24);
    insertProd.run("4442", "HARINA LA SOBERANA BLANCA 500G X24", "UND", "ARROBA", 24);

    // Create a default admin
    db.prepare("INSERT OR IGNORE INTO users (identification, name, username, password, role) VALUES (?, ?, ?, ?, ?)").run(
      "12345678", "Admin Principal", "admin", "admin123", "admin"
    );
  }
};
seedData();

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      // Get assigned warehouses
      const warehouses = db.prepare(`
        SELECT w.* FROM warehouses w
        JOIN user_warehouses uw ON w.code = uw.warehouse_code
        WHERE uw.user_id = ?
      `).all(user.id);
      res.json({ ...user, assignedWarehouses: warehouses });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.post("/api/sync-users", async (req, res) => {
    try {
      const response = await fetch("https://randomuser.me/api/?results=100");
      const data = await response.json();
      const insertUser = db.prepare("INSERT OR IGNORE INTO users (identification, name, username, password, role) VALUES (?, ?, ?, ?, ?)");
      
      const results = data.results.map((u: any) => {
        const name = `${u.name.first} ${u.name.last}`;
        const identification = u.id.value || u.login.uuid.slice(0, 8);
        insertUser.run(identification, name, u.login.username, "soberana2025", "user");
        return { identification, name, username: u.login.username };
      });

      res.json({ message: "Sincronización exitosa", count: results.length });
    } catch (error) {
      res.status(500).json({ error: "Error sincronizando usuarios" });
    }
  });

  app.get("/api/warehouses", (req, res) => {
    res.json(db.prepare("SELECT * FROM warehouses").all());
  });

  app.get("/api/products", (req, res) => {
    res.json(db.prepare("SELECT * FROM products").all());
  });

  app.post("/api/inventory-counts", (req, res) => {
    const { count_number, cut_off_date, warehouse_code, product_code, quantity_packaging, user_id } = req.body;
    
    const product = db.prepare("SELECT conversion_factor FROM products WHERE code = ?").get(product_code) as any;
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    const quantity_units = quantity_packaging * product.conversion_factor;

    const result = db.prepare(`
      INSERT INTO inventory_counts (count_number, cut_off_date, warehouse_code, product_code, quantity_packaging, quantity_units, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(count_number, cut_off_date, warehouse_code, product_code, quantity_packaging, quantity_units, user_id);

    res.json({ id: result.lastInsertRowid, quantity_units });
  });

  app.get("/api/reports", (req, res) => {
    const reports = db.prepare(`
      SELECT ic.*, p.description as product_name, w.description as warehouse_name, u.name as user_name
      FROM inventory_counts ic
      JOIN products p ON ic.product_code = p.code
      JOIN warehouses w ON ic.warehouse_code = w.code
      JOIN users u ON ic.user_id = u.id
      ORDER BY ic.created_at DESC
    `).all();
    res.json(reports);
  });

  app.post("/api/assign-warehouse", (req, res) => {
    const { user_id, warehouse_code } = req.body;
    try {
      db.prepare("INSERT OR IGNORE INTO user_warehouses (user_id, warehouse_code) VALUES (?, ?)").run(user_id, warehouse_code);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Error asignando bodega" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
