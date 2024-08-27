import sequelize from "../DB/config";
import Sequelize from "sequelize"


const category = sequelize.define('category', {
    categoryId: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    categoryKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'unique_mapping'
    },
    categoryLabel: {
        type: Sequelize.STRING,
        allowNull: false
    },
    categorySortOrder: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    categorySortBy: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    categoryStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    categoryMetaJson: {
        type: Sequelize.JSONB,
        allowNull: true
    },
    modifiedBy: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    categoryIcon: {
        type: Sequelize.STRING,
        allowNull: true
    },
    categoryType: {
        type: Sequelize.STRING,
        allowNull: true
    },
    categoryParent: {
        type: Sequelize.STRING,
        allowNull: true
    },
    categoryIsSet:{
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    categoryBrandId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: 'unique_mapping'
    },
    categoryImages:{
        type : Sequelize.ARRAY(Sequelize.STRING(510)),
        allowNull : false,
        defaultValue:[],
        
    }
}, {
    tableName: "category",
    updatedAt : true,
    createdAt : true,
    indexes: [
        {
            unique: true,
            fields: ['categoryBrandId', 'categoryKey'],
            name: 'categoryOnConflictIndex'
        }
    ]
});
export default category;