import sequelize from "../DB/config";
import Sequelize from "sequelize"


const SetMapping = sequelize.define('setMapping', {
    setMappingId: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        get() {
            let setMappingId = this.getDataValue('setMappingId')
            return  Number(setMappingId);
        }
    },
}, {
    createdAt: true,
    updatedAt: true,
    timestamps: true,
    tableName: "setMapping",
    indexes: [
        {
            unique: true,
            fields: ['variantVariantId',"setChildVariantId"],
        }
    ]
});

export default SetMapping;