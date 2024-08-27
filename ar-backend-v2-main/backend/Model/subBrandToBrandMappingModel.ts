import sequelize from "../DB/config";
import Sequelize from "sequelize"

const subBrandToBrandMapping = sequelize.define('subBrandToBrandMapping', {
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
    mappingBrandId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: 'unique_mapping',  // Specify the unique constraint name
    },
    mappingSubBrandId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: 'unique_mapping',  // Specify the unique constraint name
    },
}, {
    tableName: "subBrandToBrandMapping",
    updatedAt : true,
    createdAt : true
});

export default subBrandToBrandMapping;