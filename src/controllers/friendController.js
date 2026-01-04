// chat-backend/src/controllers/friendController.js
import db from "../../models/index.js";
import { Op } from "sequelize";

const { User, Friendship, DirectConversation } = db;

export const searchUsers = async (req, res) => {
  const { username } = req.query;
  const me = req.userId;

  // Temel kural: Kendini hariç tut
  const whereCondition = {
    id: { [Op.ne]: me }
  };

  // Eğer arama terimi varsa filtrele, yoksa hepsini getir
  if (username) {
    whereCondition.username = { [Op.iLike]: `%${username}%` };
  }

  const list = await User.findAll({
    where: whereCondition,
    attributes: ["id", "username"],
    order: [['username', 'ASC']], // Alfabetik sırala
    limit: 100 // ÖNEMLİ: Tüm veritabanını çekip sistemi kitlememek için limit koyduk
  });
  
  res.json(list);
};

export const sendRequest = async (req, res) => {
  const { toUsername } = req.body;
  const me = req.userId;
  const io = req.io;

  const target = await User.findOne({ where: { username: toUsername } });
  if (!target || target.id === me) return res.status(400).json({ error: "invalid target" });

  const [a, b] = me < target.id ? [me, target.id] : [target.id, me];

  let fr = await Friendship.findOne({ where: { userAId: a, userBId: b } });
  if (fr) {
    if (fr.status === "PENDING") return res.status(409).json({ error: "already pending" });
    if (fr.status === "ACCEPTED") return res.status(409).json({ error: "already friends" });
  } else {
    fr = await Friendship.create({
      userAId: a, userBId: b,
      status: "PENDING",
      requestedById: me
    });
    
    // YENİ: İsteği alan kullanıcıya bildirim gönder
    const meUser = await User.findByPk(me, { attributes: ['id', 'username'] });
    io.to(`user:${target.id}`).emit("friend_request:new", {
        id: fr.id,
        from: meUser
    });
  }
  res.status(201).json(fr);
};

// ... (incomingRequests ve outgoingRequests aynı kalabilir)
export const incomingRequests = async (req, res) => {
  const me = req.userId;
  const list = await Friendship.findAll({
    where: {
      status: "PENDING",
      [Op.or]: [{ userAId: me }, { userBId: me }],
      requestedById: { [Op.ne]: me }
    },
    include: [
      { model: User, as: "userA", attributes: ["id", "username"] },
      { model: User, as: "userB", attributes: ["id", "username"] },
      { model: User, as: "requester", attributes: ["id", "username"] }
    ]
  });
  res.json(list);
};

export const outgoingRequests = async (req, res) => {
  const me = req.userId;
  const list = await Friendship.findAll({
    where: {
      status: "PENDING",
      requestedById: me
    },
    include: [
      { model: User, as: "userA", attributes: ["id", "username"] },
      { model: User, as: "userB", attributes: ["id", "username"] }
    ]
  });
  res.json(list);
};


export const acceptRequest = async (req, res) => {
  const me = req.userId;
  const id = Number(req.params.id);
  const io = req.io;

  const fr = await Friendship.findByPk(id);
  if (!fr || fr.status !== "PENDING") return res.status(404).json({ error: "not found" });

  if (![fr.userAId, fr.userBId].includes(me) || fr.requestedById === me)
    return res.status(403).json({ error: "forbidden" });

  fr.status = "ACCEPTED";
  fr.acceptedAt = new Date();
  await fr.save();

  const [a, b] = [fr.userAId, fr.userBId];
  const exists = await DirectConversation.findOne({ where: { userAId: a, userBId: b } });
  if (!exists) await DirectConversation.create({ userAId: a, userBId: b });

  // YENİ: İsteği gönderen kullanıcıya kabul edildiğini bildir
  const meUser = await User.findByPk(me, { attributes: ['id', 'username']});
  io.to(`user:${fr.requestedById}`).emit("friend_request:accepted", {
      id: fr.id,
      acceptedBy: meUser
  });

  res.json(fr);
};

// ... (declineRequest, myFriends, unfriend aynı kalabilir)
export const declineRequest = async (req, res) => {
  const me = req.userId;
  const id = Number(req.params.id);
  const fr = await Friendship.findByPk(id);
  if (!fr || fr.status !== "PENDING") return res.status(404).json({ error: "not found" });
  if (![fr.userAId, fr.userBId].includes(me) || fr.requestedById === me)
    return res.status(403).json({ error: "forbidden" });

  await fr.destroy();
  res.status(204).end();
};

export const myFriends = async (req, res) => {
  const me = req.userId;
  const list = await Friendship.findAll({
    where: {
      status: "ACCEPTED",
      [Op.or]: [{ userAId: me }, { userBId: me }]
    },
    include: [
      { model: User, as: "userA", attributes: ["id", "username"] },
      { model: User, as: "userB", attributes: ["id", "username"] }
    ]
  });

  const friends = list.map((f) => {
    const friend = f.userAId === me ? f.userB : f.userA;
    return { id: friend.id, username: friend.username };
  });

  res.json(friends);
};

export const unfriend = async (req, res) => {
  const me = req.userId;
  const otherId = Number(req.params.friendUserId);
  const [a, b] = me < otherId ? [me, otherId] : [otherId, me];

  const fr = await Friendship.findOne({ where: { userAId: a, userBId: b, status: "ACCEPTED" } });
  if (!fr) return res.status(404).json({ error: "not friends" });

  await fr.destroy();
  res.status(204).end();
};