import sequelize from "../DB/config";
import Sequelize from "sequelize"


const productVariantMapping = sequelize.define('productVariantMapping', {
    mappingId: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    mappingStatus: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    createdAt: true,
    updatedAt: true,
    timestamps: true,
    tableName: "productVariantMapping",
    indexes: [
        {
            unique: true,
            fields: ["productProductId", "variantVariantId"],
            name: "productVariantOnConflict"
        }
    ]
});

export default productVariantMapping;