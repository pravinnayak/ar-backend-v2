import sequelize from "../DB/config";
import Sequelize from "sequelize"

const userToken = sequelize.define('userToken', {
    userId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        unique: true
    },
    accessToken: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    refreshToken: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, {
    tableName: "userToken",
    updatedAt : true,
    createdAt : true
});

export default userToken;