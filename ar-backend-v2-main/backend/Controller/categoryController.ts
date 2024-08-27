import aux from '../Utility/auxiliary'
import categoryQueries from '../DB/queries/CategoryQueries'
import categoryModel from '../Model/categoryModel'
import { NextFunction, Request, Response } from 'express'

class CategoryController {

    insertCategory() {
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                const categoryBrandId = req.body.categoryBrandId;
                const categories = req.body.categories;
                let upsertArr = []
                let isKeyAlreadyPresent = new Set();
                for (let eachCat of categories) {
                    if(isKeyAlreadyPresent.has(eachCat.categoryKey)) return aux.sendResponse(res, 400, `Payload array cannot have duplicate category keys: ${eachCat.categoryKey}`, null)
                    isKeyAlreadyPresent.add(eachCat.categoryKey)

                    let insertObj = {
                        categoryKey: eachCat.categoryKey,
                        categoryLabel: eachCat.categoryLabel,
                        categorySortOrder: eachCat.categorySortOrder || 1,
                        categorySortBy: eachCat.categorySortBy || null,
                        categoryIcon: eachCat.categoryIcon || null,
                        categoryBrandId,
                        categoryParent: eachCat?.categoryParent || null,
                        categoryMetaJson: eachCat.categoryMetaJson || null,
                        modifiedBy: process.env.USER_MODIFIED_BY,
                        categorySubBrandId: eachCat?.categorySubBrandId || categoryBrandId,
                        categoryStatus: eachCat?.categoryStatus,
                        categoryIsSet: eachCat?.categoryIsSet || false,
                        categoryType: eachCat?.categoryType || null,
                        categoryImages: eachCat?.categoryImages || [],
                    };
                    upsertArr.push(insertObj);
                }

                const response:any = await categoryQueries.bulkInsertCategory(upsertArr);
                if (response?.length === 0) return aux.sendResponse(res, 400, "No data has been inserted", null)
                else if (response?.length !== upsertArr.length) return aux.sendResponse(res, 201, "Some of the data has been inserted", null)
                else return aux.sendResponse(res, 201, "All data's are inserted", null)
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }

    getCategoryParentDetails() {
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                const brandId = req?.params?.brandId
                let condition = {
                    categoryBrandId: brandId,
                    categoryStatus: true
                }
                const response = (await categoryQueries.getCategoryParentDetails(condition))?.[0]
                if (!response.length) return aux.sendResponse(res, 200, "No data found", null)
                return aux.sendResponse(res, 200, "Fetched category parent details successfully", response)
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }

    updateCategoryDetails() {
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                const { categoryBrandId, categoryKey } = req?.body
                let updateObject = { ...req?.body }
                delete updateObject?.categoryBrandId
                delete updateObject?.categoryKey

                let updateCondition = { categoryBrandId, categoryStatus: true, categoryKey }
                const updateResult = await categoryQueries?.update(categoryModel, updateCondition, updateObject)
                console.log("🚀 ~ CategoryController ~ return ~ updateResult:", updateResult)
                if (updateResult?.[0]) return aux.sendResponse(res, 200, "Category details updated successfully.", null);
                return aux.sendResponse(res, 400, "Category details update failed", null);
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }
    
    getCategoryDetails() {
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                const brandId = req?.params?.brandId;
                const subBrandId = req?.params?.subBrandId;
                let categoryParent = req.query?.parent;
                if(categoryParent !== null && categoryParent) categoryParent = req.query?.parent?.toString()
                let categoryWhere = ` AND c."categoryBrandId" = :brandId `;
                if(categoryParent || categoryParent === null) categoryWhere += ` AND c."categoryParent" = :categoryParent `;
                if(subBrandId) categoryWhere += ` AND c."categorySubBrandId" = :subBrandId `;

                let object= {
                    brandId,
                    categoryParent,
                    subBrandId
                }
                
                const categoryDetails = (await categoryQueries.getCategoryDetails(categoryWhere, object))?.[0]
                if(!categoryDetails?.length) return aux.sendResponse(res, 200, "No data found", null)
                return aux.sendResponse(res, 200, "Got category details fetched", categoryDetails)
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }
}

const controller = new CategoryController()
export default controller;