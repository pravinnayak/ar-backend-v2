import sequelize from "../DB/config";
import Sequelize from "sequelize"


const variant = sequelize.define('variant', {
    variantId: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        get() {
            let variantId = this.getDataValue('variantId')
            return  Number(variantId);
        }
        // unique: "unique_mapping_1"

    },
    variantSku: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "unique_mapping_2"
    },
    variantTitle: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    variantDescription: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    variantImageURLs: {
        type: Sequelize.JSON,
        defaultValue: {}
    },
    variantThumbnails: {
        type: Sequelize.JSON,
        defaultValue: {}
    },
    variantWebsiteLink: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    variantTags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
    },
    variantOrderId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 1.0,
        get() {
            let orderId = this.getDataValue('variantOrderId')
            return isNaN(orderId) ? null : Number(orderId);
        }
    },
    variantMetaJSON: {
        type: Sequelize.JSON,
        allowNull: true
    },
    variantData: {
        type: Sequelize.JSON,
        allowNull: true
    },
    variantStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    variantPrice: {
        type: Sequelize.BIGINT,
        allowNull: true,
        get() {
            let price = this.getDataValue('variantPrice')
            return !price ? 0 : Number(price);
        }
        
    },
    variantCompareAtPrice: {
        type: Sequelize.BIGINT,
        allowNull: true,
        get() {
            let comparePrice = this.getDataValue('variantCompareAtPrice')
            return !comparePrice ? 0 : Number(comparePrice);
        }
    },
    variantIsCalibrated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    variantIsQCCalibrated:{
        type:Sequelize.BOOLEAN,
        defaultValue: false  
    },
    variantFilter: {
        type: Sequelize.JSON,
        allowNull: true
    },
    variantBrandId: {
        type: Sequelize.UUID,
        allowNull: false,
        // unique: "unique_mapping_1",
        unique: "unique_mapping_2"
    },
    modifiedBy: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    variantCategoryId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: "unique_mapping_2"
    },
    variantIsSetOnly: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    variantInventory: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
    },
    variantHeight: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
            1: 1.0
        }
    },
    variantXoffset: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
            1: 1.0
        }
    },
    variantYoffset: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
            1: 1.0
        }
    },
}, {
    createdAt: true,
    updatedAt: true,
    timestamps: true,
    tableName: "variant",
    indexes: [
        {
            unique: true,
            fields: ['variantSku', "variantCategoryId", 'variantBrandId'],
            name: 'unique_mapping_2'
        }
    ]
});

export default variant;