// chat-backend/src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../models/index.js";

const { User } = db;

export async function register(req, res) {
  const { email, username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, password: hash });
    
    // Kayıt sonrası direkt login yapalım ve token döndürelim
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ 
        token, 
        user: { id: user.id, email, username } 
    });

  } catch (e) {
    res.status(400).json({ error: "User exists or invalid data" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  
  // Frontend'in beklediği 'user' objesini ekliyoruz
  res.json({ 
      token, 
      user: {
          id: user.id,
          username: user.username,
          email: user.email
      }
  });
}