import BaseQueries from './BaseQueries';
import sequelize from '../config';
import { FindOptions, Order, QueryTypes, WhereOptions } from 'sequelize';
import Sequelize from "sequelize";
require('../association')
import productModel from '../../Model/productModel';
import variant from '../../Model/variantModel';
import productVariantMapping from '../../Model/productVariantMappingModel';
import category from '../../Model/categoryModel';

class ProductQueries extends BaseQueries {
    constructor() {
        super()
    }

    bulkUpsertProductDetails(records: any, columnsToUpdate: string[]) {
        const updateOnDuplicate = this.columnNamesExcept(
            columnsToUpdate,
            ['productId', 'productHandle', 'productBrandId', 'productCategoryId']
        );
        return productModel.bulkCreate(records, {
            returning: ['*'], 
            updateOnDuplicate,
            conflictAttributes: ['productHandle', 'productBrandId', 'productCategoryId'],
        });
    }
    
    bulkUpsertVariantDetails(records: any, columnsToUpdate: string[]) {
        const updateOnDuplicate = this.columnNamesExcept(
            columnsToUpdate,
            ['variantId', 'variantSku', "variantCategoryId", 'variantBrandId']
        );
        return variant.bulkCreate(records, {
            returning: ['*'],
            updateOnDuplicate,
            conflictAttributes: ['variantSku', "variantCategoryId", 'variantBrandId'],
        });
    }    
    bulkInsertProductVariantMapping(records:any) {
        return productVariantMapping.bulkCreate(records, {
            returning: true,
            updateOnDuplicate: this.columnNamesExcept(Object.keys(productVariantMapping.getAttributes()), ["mappingId", "productProductId", "variantVariantId"]),
            conflictAttributes: ["productProductId", "variantVariantId"],
        })
    }
    getVariantsAndProduct({
        variantObj = { where: {}, order: null },
        productObj = { where: {}, order: null },
        where = {},
        order = null,
        limit
    }:{
        variantObj?:any,
        productObj?:any,
        where?:any,
        order?:any,
        limit?:number
    }) {
        return productVariantMapping.findAll({
            include: [
                {
                    include: [
                        {
                            model: category,
                            required: true,
                            where: {
                                categoryStatus: true
                            }
                        }
                    ],
                    model: variant,
                    required: true,
                    ...variantObj
                },
                {
                    model: productModel,
                    required: true,
                    ...productObj
                }
            ],
            where: where,
            order,
            limit
        })
    }
    getVariantDetails(where:WhereOptions, order?:Order, limit?:number) {
        return variant.findAll({ where: where, order: order, limit: limit })
    }
    getVariantDetailsSequelize(findAllClause:FindOptions){
        return variant.findAll(findAllClause)
    }
    getProductDetailsSequelize(findAllClause:FindOptions){
        return productModel.findAll(findAllClause)
    }
    getProductDetailsAndCountSequelize(findAllClause:FindOptions){
        return productModel.findAndCountAll(findAllClause)
    }
    getProductCountSequelize(countClause:FindOptions){
        return productModel.count(countClause)
    }
    getVariantDetailsBasedOnCategorySequelize(findAllClause: FindOptions){
        return variant.findAndCountAll(findAllClause)
    }
}

const queries = new ProductQueries();
export {
    queries as ProductQueries
};