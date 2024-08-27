import sequelize from "../DB/config";
import Sequelize from "sequelize"

const user = sequelize.define('user', {
    userId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    userName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    userPassword: {
        type: Sequelize.STRING,
        allowNull: true
    },
    userProfileImage: {
        type: Sequelize.STRING,
        allowNull: true
    },
    userEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
    },
    userStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    userPhone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
    },
    userSalt: {
        type: Sequelize.STRING,
        allowNull: true,
    },
}, {
    tableName: "user",
    updatedAt : true,
    createdAt : true
});
export default user;