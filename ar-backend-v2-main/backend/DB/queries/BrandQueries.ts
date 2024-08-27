import BaseQueries from './BaseQueries';
import sequelize from '../config';
import { QueryTypes, BindOrReplacements, FindOptions } from 'sequelize';
import Sequelize from "sequelize"
import subBrandMappingModel from '../../Model/subBrandToBrandMappingModel';
import category from '../../Model/categoryModel';
require('../association');


class BrandQueries extends BaseQueries {
    constructor() {
        super()
    }

    async getBrandDetailsByBrandId(replacementData: BindOrReplacements) {
        try {
            const response = await sequelize.query(`
            SELECT 
                b."brandId", 
                b."brandAliasName",
                b."brandBucketName",
                b."brandMaxProducts",
                b."brandMetaJson",
                b."brandTermsConditionLink",
                b."brandType",
                bS."settingLogo",
                bS."settingThemeColor",
                bS."settingMetaJson"
            FROM 
                brand AS b
            LEFT JOIN 
                "brandSetting" AS bS ON b."brandId" = bS."settingBrandId" AND bS."settingStatus" = true
            WHERE 
                b."brandId" = :brandId 
                AND b."brandActiveStatus" = true
            GROUP BY 
                b."brandId", 
                b."brandAliasName",
                b."brandBucketName",
                b."brandMaxProducts",
                b."brandMetaJson",
                b."brandTermsConditionLink",
                b."brandType",
                bS."settingLogo",
                bS."settingThemeColor",
                bS."settingMetaJson";`, {
                    replacements: replacementData
                })
            return response;
        } catch (error) {
            throw error
        }
    }

    async getBrandDetailsByBrandName(replacementData: BindOrReplacements) {
        try {
            const response = await sequelize.query(`
            SELECT 
                b."brandId", 
                b."brandAliasName",
                b."brandBucketName",
                b."brandMaxProducts",
                b."brandMetaJson",
                b."brandTermsConditionLink",
                b."brandType",
                bS."settingLogo",
                bS."settingThemeColor",
                bS."settingMetaJson"
            FROM 
                brand AS b
            LEFT JOIN 
                "brandSetting" AS bS ON b."brandId" = bS."settingBrandId" AND bS."settingStatus" = true
            WHERE 
                b."brandAliasName" = :brandName 
                AND b."brandActiveStatus" = true
            GROUP BY 
                b."brandId", 
                b."brandAliasName",
                b."brandBucketName",
                b."brandMaxProducts",
                b."brandMetaJson",
                b."brandTermsConditionLink",
                b."brandType",
                bS."settingLogo",
                bS."settingThemeColor",
                bS."settingMetaJson";`, {
                    replacements: replacementData
                })
            return response;
        } catch (error) {
            throw error
        }
    }
    getActiveProductCode(findAllClause:FindOptions){
        return category.findAll(findAllClause)
    }
}

const queries = new BrandQueries()
export default queries;