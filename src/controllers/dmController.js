// src/controllers/dmController.js
import db from "../../models/index.js";
import { Op } from "sequelize";

const { DirectConversation, Message, Friendship, User } = db;

// helper
const isFriends = async (u1, u2) => {
  const [a, b] = u1 < u2 ? [u1, u2] : [u2, u1];
  const fr = await Friendship.findOne({
    where: { userAId: a, userBId: b, status: "ACCEPTED" }
  });
  return !!fr;
};

export const ensureDm = async (req, res, next) => {
  try {
    const me = req.userId;
    const otherId = Number(req.params.otherUserId);

    if (me === otherId) return res.status(400).json({ error: "self dm not allowed" });
    if (!(await isFriends(me, otherId))) {
      return res.status(403).json({ error: "Not friends" });
    }

    const [a, b] = me < otherId ? [me, otherId] : [otherId, me];

    let conv = await DirectConversation.findOne({ where: { userAId: a, userBId: b } });
    if (!conv) conv = await DirectConversation.create({ userAId: a, userBId: b });

    res.json(conv);
  } catch (err) {
    next(err);
  }
};

export const listMyDms = async (req, res, next) => {
  try {
    const me = req.userId;
    const convs = await DirectConversation.findAll({
      where: { [Op.or]: [{ userAId: me }, { userBId: me }] },
      include: [
        { model: User, as: "userA", attributes: ["id", "username"] },
        { model: User, as: "userB", attributes: ["id", "username"] }
      ],
      order: [["updatedAt", "DESC"]]
    });
    res.json(convs);
  } catch (err) {
    next(err);
  }
};

export const listMessages = async (req, res, next) => {
  try {
    const me = req.userId;
    const convId = Number(req.params.id);
    const conv = await DirectConversation.findByPk(convId);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    if (![conv.userAId, conv.userBId].includes(me)) return res.status(403).json({ error: "Forbidden" });

    const msgs = await Message.findAll({
      where: { conversationId: convId },
      include: [{ model: User, attributes: ["id", "username"] }],
      order: [["createdAt", "ASC"]]
    });
    res.json(msgs);
  } catch (err) {
    next(err);
  }
};

// sendMessage fonksiyonu buradan kaldırıldı.