// models/DirectConversation.js
export default (sequelize, DataTypes) => {
  const DirectConversation = sequelize.define(
    "DirectConversation",
    {
      userAId: { type: DataTypes.INTEGER, allowNull: false },
      userBId: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["userAId", "userBId"]
        }
      ]
    }
  );

  // userAId < userBId kuralını koru
  DirectConversation.beforeValidate((conv) => {
    if (conv.userAId > conv.userBId) {
      const tmp = conv.userAId;
      conv.userAId = conv.userBId;
      conv.userBId = tmp;
    }
  });

  DirectConversation.associate = (models) => {
    DirectConversation.hasMany(models.Message, {
      foreignKey: "conversationId"
    });
    DirectConversation.belongsTo(models.User, { as: "userA", foreignKey: "userAId" });
    DirectConversation.belongsTo(models.User, { as: "userB", foreignKey: "userBId" });
  };

  return DirectConversation;
};
