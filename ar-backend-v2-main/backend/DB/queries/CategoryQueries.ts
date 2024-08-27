import BaseQueries from './BaseQueries';
import sequelize from '../config'
import { QueryTypes, BindOrReplacements, Order, WhereOptions } from 'sequelize';
import Sequelize from "sequelize";
import categoryModel from '../../Model/categoryModel';
require('../association')

class CategoryQueries extends BaseQueries {
    constructor() {
        super()
    }

    async bulkInsertCategory(replacementData: any) {
        try {
            return await categoryModel.bulkCreate(replacementData,{
                updateOnDuplicate: [ "categoryLabel", "categorySortOrder", "categoryIsSet", "categorySortBy", "categoryStatus", "categoryMetaJson", "modifiedBy", "categoryIcon", "categoryType", "categoryParent", "categorySubBrandId" ],
                returning : true,
                // ignoreDuplicates: true,
                conflictAttributes:["categoryBrandId","categoryKey"],
            })
        } catch (error) {
            throw error;
        }
    }

    async getCategoryParentDetails(replacementData: BindOrReplacements) {
        try {
            const response = await sequelize.query(`
            SELECT DISTINCT ON (c."categoryParent") c."categoryParent", c."categoryId"
            FROM "category" AS c
            WHERE c."categoryBrandId" = :categoryBrandId AND c."categoryStatus" = :categoryStatus
            ORDER BY c."categoryParent", c."categoryId" ASC;
            `, {
                replacements: replacementData
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    async getCategoryDetails(categoryWhere:any, replacementData:BindOrReplacements) {
        try {
            const response = await sequelize.query(`
            SELECT 
            c."categoryType", 
            c."categoryLabel", 
            c."categoryKey", 
            c."categoryMetaJson",
            c."categoryIcon",
            c."categoryId",
            c."categoryParent",
            c."categoryImages",
            COUNT(v.*) AS "activeVariantCount"
            FROM category AS c
            LEFT JOIN 
                variant AS v ON v."variantCategoryId" = c."categoryId" AND v."variantStatus" = true AND v."variantBrandId" = :brandId
            WHERE c."categoryStatus" = true ${categoryWhere && categoryWhere}
            GROUP BY c."categoryId"
            ORDER BY c."categorySortOrder" ASC;
            `, {
                replacements: replacementData
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    getCategoriesBasedOnWhere(where:WhereOptions, order?:Order){
        return categoryModel.findAll({
            where,
            order : order
        })
    }

    async bulkInsertCategoryV1(replacementData:any) {
        try {
            return await categoryModel.bulkCreate(replacementData,{
                conflictAttributes:["categoryBrandId","categoryKey"],
                returning : true,
                ignoreDuplicates: true,
            })
        } catch (error) {
            throw error;
        }
    }
}

const queries = new CategoryQueries();
export default queries;