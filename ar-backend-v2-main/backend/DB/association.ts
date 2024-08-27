import brandModel from '../Model/brandModel';
import brandSettingModel from '../Model/brandSettingModel';
import categoryModel from '../Model/categoryModel';
import subBrandToBrandMappingModel from '../Model/subBrandToBrandMappingModel';
import userModel from '../Model/userModel';
import userBrandMappingModel from '../Model/userBrandMappingModel';
import productModel from '../Model/productModel';
import productVariantMapping from '../Model/productVariantMappingModel';
import variantModel from '../Model/variantModel';
import userTokenModel from '../Model/userTokenModel';
import userForgetPassword from '../Model/userForgetPassword';
import SetMapping from '../Model/setModel';

brandModel.hasMany(categoryModel, {
    foreignKey: {
        name: "categoryBrandId",
        allowNull: false
    }
})
categoryModel.belongsTo(brandModel, {
    foreignKey: {
        name: "categoryBrandId",
        allowNull: false
    }
})

brandModel.hasMany(categoryModel, {
    foreignKey: {
        name: "categorySubBrandId",
        allowNull: true
    }
})
categoryModel.belongsTo(brandModel, {
    foreignKey: {
        name: "categorySubBrandId",
        allowNull: true
    }
})

brandModel.hasOne(brandSettingModel, {
    foreignKey: {
        name: "settingBrandId",
        allowNull: false
    }
})
brandSettingModel.belongsTo(brandModel, {
    foreignKey: {
        name: "settingBrandId",
        allowNull: false
    }
})

brandModel.hasMany(subBrandToBrandMappingModel, {
    foreignKey: {
        name: "mappingBrandId",
        allowNull: false
    }
})
subBrandToBrandMappingModel.belongsTo(brandModel, {
    foreignKey: {
        name: "mappingBrandId",
        allowNull: false
    }
})

brandModel.hasMany(subBrandToBrandMappingModel, {
    foreignKey: {
        name: "mappingSubBrandId",
        allowNull: false
    }
})
subBrandToBrandMappingModel.belongsTo(brandModel, {
    foreignKey: {
        name: "mappingSubBrandId",
        allowNull: false
    }
})

userModel.hasMany(subBrandToBrandMappingModel, {
    foreignKey: {
        name: "modifiedBy",
        allowNull: false
    }
})
subBrandToBrandMappingModel.belongsTo(userModel, {
    foreignKey: {
        name: "modifiedBy",
        allowNull: false
    }
})

brandModel.hasMany(userBrandMappingModel, {
    foreignKey: {
        name: "mappingBrandId",
        allowNull: false
    }
})
userBrandMappingModel.belongsTo(brandModel, {
    foreignKey: {
        name: "mappingBrandId",
        allowNull: false
    }
})

userModel.hasMany(userBrandMappingModel, {
    foreignKey: {
        name: "mappingUserId",
        allowNull: false
    }
})
userBrandMappingModel.belongsTo(userModel, {
    foreignKey: {
        name: "mappingUserId",
        allowNull: false
    }
})

brandModel.hasMany(productModel, {
    foreignKey: {
        name: "productBrandId",
        allowNull: false
    }
})
productModel.belongsTo(brandModel, {
    foreignKey: {
        name: "productBrandId",
        allowNull: false
    }
})

brandModel.hasMany(productModel, {
    foreignKey: {
        name: "productSubBrandId",
        allowNull: false
    }
})
brandModel.hasMany(variantModel, {
    foreignKey: {
        name: "variantBrandId",
        allowNull: false
    },
    onUpdate:'CASCADE'
})
productModel.belongsTo(brandModel, {
    foreignKey: {
        name: "productSubBrandId",
        allowNull: false
    }
})
variantModel.belongsTo(brandModel, {
    foreignKey: {
        name: "variantBrandId",
        allowNull: false
    },
    onUpdate:'CASCADE'
})

categoryModel.hasMany(productModel, {
    foreignKey: {
        name: "productCategoryId",
        allowNull: false
    }
})
productModel.belongsTo(categoryModel, {
    foreignKey: {
        name: "productCategoryId",
        allowNull: false
    }
})
categoryModel.hasMany(variantModel, {
    foreignKey: {
        name: "variantCategoryId",
        allowNull: false
    }
})
variantModel.belongsTo(categoryModel, {
    foreignKey: {
        name: "variantCategoryId",
        allowNull: false
    }
})

userModel.hasMany(productModel, {
    foreignKey: {
        name: "modifiedBy",
        allowNull: true
    }
})
productModel.belongsTo(userModel, {
    foreignKey: {
        name: "modifiedBy",
        allowNull: true
    }
})


userModel.hasOne(userTokenModel, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
})
userTokenModel.belongsTo(userModel, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
})

userModel.hasMany(userForgetPassword, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
})
userForgetPassword.belongsTo(userModel, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
})

variantModel.belongsToMany(productModel,{
    through:productVariantMapping,
})
productModel.belongsToMany(variantModel,{
    through:productVariantMapping,
})
variantModel.hasMany(productVariantMapping);
productVariantMapping.belongsTo(variantModel);
productModel.hasMany(productVariantMapping);
productVariantMapping.belongsTo(productModel);


variantModel.belongsToMany(variantModel,{
    through:SetMapping,
    as:"setChild"
})
variantModel.hasMany(SetMapping);
SetMapping.belongsTo(variantModel);