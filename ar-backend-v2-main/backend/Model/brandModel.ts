import sequelize from "../DB/config";
import Sequelize from "sequelize"

const brand = sequelize.define('brand', {
    brandId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
    },
    brandAliasName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    brandUsername: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    brandUserPassword: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    brandBucketName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    brandMaxProducts: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    brandLicenseExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    brandType: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    brandContactEmail: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    brandTermsConditionLink: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    brandMetaJson: {
        type: Sequelize.JSONB,
        allowNull: true,
    },
    modifiedBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    brandActiveStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    brandAmplitudeId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    brandAmplitudeSecret: {
        type: Sequelize.STRING,
        allowNull: true
    },
    brandIsSubBrand: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    brandSubBrandName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    brandSalt: {
        type: Sequelize.STRING,
        allowNull: true
    },
    brandNewMirrarApplicable:{
        type:Sequelize.BOOLEAN,
        defaultValue:true,
        allowNull:false
    }
}, {
    tableName: "brand",
    updatedAt : true,
    createdAt : true
});

export default brand;