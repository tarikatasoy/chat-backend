// models/User.js
export default (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    email:    { type: DataTypes.STRING, unique: true, allowNull: false },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }
  });
  User.associate = (models) => {
    User.hasMany(models.Message, { foreignKey: "userId" });
  };
  return User;
};
