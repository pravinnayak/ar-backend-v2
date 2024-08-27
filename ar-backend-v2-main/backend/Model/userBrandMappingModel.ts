import sequelize from "../DB/config";
import Sequelize from "sequelize"

const userBrandMapping = sequelize.define('userBrandMapping', {
    mappingId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    mappingStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    modifiedBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    mappingUserRole: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    mappingUserId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: 'unique_mapping'
    },
    mappingBrandId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: 'unique_mapping'
    },
}, {
    tableName: "userBrandMapping",
    updatedAt : true,
    createdAt : true
});

export default userBrandMapping;