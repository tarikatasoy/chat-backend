// models/Message.js
export default (sequelize, DataTypes) => {
  const Message = sequelize.define("Message", {
    body: { type: DataTypes.TEXT, allowNull: false },
    conversationId: { type: DataTypes.INTEGER, allowNull: false }   // <-- yeni
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: "userId" });
    Message.belongsTo(models.DirectConversation, { foreignKey: "conversationId" });
  };

  return Message;
};
