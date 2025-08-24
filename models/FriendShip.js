export default (sequelize, DataTypes) => {
  const Friendship = sequelize.define(
    "Friendship",
    {
      userAId:       { type: DataTypes.INTEGER, allowNull: false },
      userBId:       { type: DataTypes.INTEGER, allowNull: false },
      status:        { type: DataTypes.ENUM("PENDING", "ACCEPTED", "BLOCKED"), defaultValue: "PENDING" },
      requestedById: { type: DataTypes.INTEGER, allowNull: false },
      acceptedAt:    { type: DataTypes.DATE }
    },
    {
      indexes: [
        { unique: true, fields: ["userAId", "userBId"] }
      ]
    }
  );

  Friendship.beforeValidate((f) => {
    if (f.userAId > f.userBId) {
      const t = f.userAId;
      f.userAId = f.userBId;
      f.userBId = t;
    }
  });

  Friendship.associate = (models) => {
    Friendship.belongsTo(models.User, { as: "userA", foreignKey: "userAId" });
    Friendship.belongsTo(models.User, { as: "userB", foreignKey: "userBId" });
    Friendship.belongsTo(models.User, { as: "requester", foreignKey: "requestedById" });
  };

  return Friendship;
};
