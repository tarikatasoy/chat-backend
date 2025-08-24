// chat-backend/src/controllers/conversationController.js
import db from "../../models/index.js";
import { Op } from "sequelize";

const { DirectConversation, Message, User } = db;

export const listMyConversations = async (req, res, next) => {
  try {
    const me = req.userId;
    const conversations = await DirectConversation.findAll({
      where: { [Op.or]: [{ userAId: me }, { userBId: me }] },
      include: [
        { model: User, as: "userA", attributes: ["id", "username"] },
        { model: User, as: "userB", attributes: ["id", "username"] },
        { model: Message, limit: 1, order: [["createdAt", "DESC"]] } // Son mesajı al
      ],
      order: [["updatedAt", "DESC"]]
    });

    // Frontend'in beklediği formata dönüştür
    const formattedConversations = conversations.map(conv => {
      const participant = conv.userA.id === me ? conv.userB : conv.userA;
      return {
        id: conv.id,
        participant: {
            id: participant.id,
            username: participant.username,
            // isOnline durumu socket'ten gelecek, burada false başlatabiliriz.
            isOnline: false 
        },
        lastMessage: conv.Messages[0] || null
      };
    });

    res.json(formattedConversations);
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
      // Artık userId client'ta var, user'ı include etmeye gerek yok.
      // include: [{ model: User, attributes: ["id", "username"] }],
      order: [["createdAt", "ASC"]]
    });
    res.json(msgs);
  } catch (err) {
    next(err);
  }
};