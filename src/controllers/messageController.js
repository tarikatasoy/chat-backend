import { models } from "../server.js";

export async function createMessage(req, res) {
  const { body } = req.body;
  const message = await models.Message.create({ body, userId: req.userId });
  res.status(201).json(message);
}

export async function listMessages(req, res) {
  const messages = await models.Message.findAll({
    include: [{ model: models.User, attributes: ["username"] }],
    order: [["createdAt", "DESC"]]
  });
  res.json(messages);
}
