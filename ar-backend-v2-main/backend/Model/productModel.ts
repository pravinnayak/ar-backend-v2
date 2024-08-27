import sequelize from "../DB/config";
import Sequelize from "sequelize"


const product = sequelize.define('product', {
    productId: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        get() {
            let productId = this.getDataValue('productId')
            return  Number(productId);
        }
    },
    productHandle: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "unique_mapping"
    },
    productStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    productMetaJSON: {
        type: Sequelize.JSON,
        allowNull: true
    },
    productImages: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
    },
    productTitle: {
        type: Sequelize.STRING,
        allowNull: true
    },
    productCollection: {
        type: Sequelize.STRING,
        allowNull: true
    },
    modifiedBy: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    productBrandId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: "unique_mapping"
    },
    productSubBrandId: {
        type: Sequelize.UUID,
        allowNull: true
    },
    productCategoryId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        get() {
            let productCategoryId = this.getDataValue('productCategoryId')
            return  Number(productCategoryId);
        },
        unique: "unique_mapping"
    },
}, {
    tableName: "product",
    timestamps : true,
    updatedAt : true,
    createdAt: true,
    indexes: [
        {
            unique: true,
            fields: ['productHandle', 'productBrandId', 'productCategoryId'],
            name: 'productOnConflictIndex'
        }
    ]
});

export default product;