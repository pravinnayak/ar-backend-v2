import sequelize from "../DB/config";
import Sequelize, {DataTypes} from "sequelize"

const userForgetPassword = sequelize.define('userForgetPassword', {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    userEmail: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
    },
    frontEndRedirectPath: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    location: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    expiryAt: {
        type: Sequelize.DATE,
        defaultValue: DataTypes.NOW
    },
}, {
    tableName: "userForgetPassword",
    updatedAt : true,
    createdAt : true
});

export default userForgetPassword;