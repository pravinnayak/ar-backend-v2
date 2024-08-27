import sequelize from "../DB/config";
import Sequelize from "sequelize"

const brandSetting = sequelize.define('brandSetting', {
    settingId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    settingBrandId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true
    },
    settingStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    settingLogo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    settingThemeColor: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    settingMetaJson: {
        type: Sequelize.JSONB,
        allowNull: true,
    },
    modifiedBy: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
}, {
    tableName: "brandSetting",
    updatedAt : true,
    createdAt : true
});

export default brandSetting;