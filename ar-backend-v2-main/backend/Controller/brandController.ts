import brandQueries from '../DB/queries/BrandQueries';
import brandModel from '../Model/brandModel';
import aux from '../Utility/auxiliary';
import userModel from '../Model/userModel';
import moment from "moment";
import brandSetting from '../Model/brandSettingModel';
import subBrandMappingModel from '../Model/subBrandToBrandMappingModel';
import userBrandMappingModel from '../Model/userBrandMappingModel';
import categoryModel from '../Model/categoryModel';
import ProductModel from '../Model/productModel';
import lodash from 'lodash';
import CategoryQueries from '../DB/queries/CategoryQueries';
import { createCategoriesForBrand } from '../Utility/staticData';
import { NextFunction, Request, Response } from 'express';
import { FindOptions } from 'sequelize';
import VariantModel from '../Model/variantModel';

class BrandController {
    res() {
        return {
            errorcallback: function (obj: { status: number, message: string }) {
                return this;
            },
            successcallback: function (obj: { status: number, message: string }) {
                return this;
            },
            status: function () {
                return this;
            },
            finalCallback: function (obj: { status: number, message: string }): any {
                return this;
            },
            json: function (obj: { status: number, message: string }) {
                if (obj && obj.status != 200) {
                    this.errorcallback(obj);
                } else {
                    this.successcallback(obj);
                }
                this.finalCallback(obj);
                return this;
            },
            jsonp: function (obj: { status: number, message: string }) {
                if (obj && obj.status != 200) {
                    this.errorcallback(obj);
                } else {
                    this.successcallback(obj);
                }
                this.finalCallback(obj);
                return this;
            },
            send: function () {
                return this;
            },
        };
    }

    createBrand() {
        return async (req: Request | any, res: Response | any, next?: NextFunction) => {
            try {
                const payload = req?.body
                if (payload?.brandIsSubBrand) {

                    const errStr = aux.requiredParamMissingHandler(payload, [
                        "parentBrandId",
                        "brandSubBrandName",
                    ]);
                    if (payload?.parentBrandId == "" || payload?.brandSubBrandName == "") return aux.sendResponse(res, 400, "Parent brand id and sub brand name is required when brandIsSubBrand is true.")

                    if (errStr) {
                        return aux.sendResponse(
                            res,
                            400,
                            `When brand is sub Brand Id, Required Param - ${errStr} are needed`,
                            null
                        );
                    }
                }
                const excludeColumns = ['brandUserPassword', 'brandSalt', 'createdAt', 'updatedAt', 'modifiedBy', 'brandLicenseExpiry']
                const isBrandExists = (await brandQueries.getSingleDataByCondition(brandModel, { brandAliasName: payload?.brandAliasName, brandActiveStatus: true }, excludeColumns))?.dataValues
                if (isBrandExists?.brandId) return aux.sendResponse(res, 200, "Brand already exists", isBrandExists)
                else {
                    let userDetails;
                    let message;
                    let subBrandMessage;
                    let encryptedPassword;
                    let salt;
                    let insertedUser;

                    try {

                        userDetails = (await brandQueries.getSingleDataByCondition(userModel, { userEmail: payload?.brandContactEmail, userStatus: true }))?.dataValues
                        if (userDetails?.userId) message = " User already exists. Use the existing credentials to login.";
                        else {
                            [encryptedPassword, salt] = await aux.encryptPassword(payload?.brandUserPassword);

                            insertedUser =
                                (
                                    await brandQueries.createData(userModel, {
                                        userName: payload?.brandUsername,
                                        userPassword: encryptedPassword,
                                        userSalt: salt,
                                        userEmail: payload?.brandContactEmail
                                    })
                                )?.dataValues

                            if (!insertedUser?.userId) return aux.sendResponse(res, 400, 'User insertion failed', null)
                        }
                    } catch (error) {
                        console.log(error);
                        const { errorName } = aux.getSequelizeError(error)
                        return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
                    }

                    try {

                        payload.brandLicenseExpiry = moment().add("10", "year").utc().toISOString()
                        payload.brandUserPassword = encryptedPassword || userDetails?.userPassword
                        payload.brandSalt = salt || userDetails?.userSalt
                        payload.brandIsSubBrand = payload?.brandIsSubBrand || false
                        payload.brandSubBrandName = payload?.brandSubBrandName || ""
                        payload.brandType = payload?.brandType || 'jewellery-ar'
                        payload.brandMetaJson = payload?.brandMetaJson || {}
                        payload.brandTermsConditionLink = payload?.brandTermsConditionLink || ""
                        payload.brandMaxProducts = payload?.brandMaxProducts || 1000
                        payload.brandNewMirrarApplicable = payload?.brandNewMirrarApplicable || true
                        // payload.brandBucketName = payload?.brandBucketName || null
                        // payload.modifiedBy = 

                        const insertedBrand = (await brandQueries.createData(brandModel, payload))?.dataValues
                        if (!insertedBrand?.brandId) return aux.sendResponse(res, 400, "Brand creation failed - 1", null)

                        if (payload?.brandIsSubBrand) {
                            const replacementData = {
                                mappingBrandId: payload?.parentBrandId,
                                mappingSubBrandId: insertedBrand?.brandId,
                                mappingStatus: true,
                                modifiedBy: +(process.env.USER_MODIFIED_BY || 0)
                            }
                            const subBrandMappingOnConflict = ["mappingBrandId", "mappingSubBrandId"];
                            const subBrandMappingUpdateCols = ["mappingStatus", "modifiedBy"];

                            const subBrandMappingRes = (await brandQueries.upsert(subBrandMappingModel, [replacementData], subBrandMappingUpdateCols, subBrandMappingOnConflict))?.[0]
                            if (!subBrandMappingRes?.mappingId) subBrandMessage = "Sub brand id was present, but insertion was failed."
                        }
                        let object = {
                            mappingUserId: insertedUser?.userId || userDetails?.userId,
                            mappingBrandId: insertedBrand?.brandId,
                            mappingStatus: true,
                            mappingUserRole: "admin",
                            modifiedBy: insertedUser?.userId || userDetails?.userId,
                        };
                        const userBrandMappingConflictCols = ["mappingUserId", "mappingBrandId"]
                        const userBrandMapUpdateCols = ["mappingStatus", "modifiedBy", "mappingUserRole"]
                        const userBrandMappingInserted = await brandQueries.upsert(userBrandMappingModel, [object], userBrandMapUpdateCols, userBrandMappingConflictCols)

                        if (!userBrandMappingInserted?.length) return aux.sendResponse(res, 400, "Brand creation failed - 2", null)
                        // const brandDetails = (await brandQueries.getBrandDetailsByBrandId({ brandId: insertedBrand?.brandId }))?.[0]
                        try {
                            let response = await CategoryQueries.bulkInsertCategoryV1(createCategoriesForBrand(insertedBrand?.brandId))
                        } catch (error) {
                            console.log(error)
                            const { errorName } = aux.getSequelizeError(error)
                            return aux.sendResponse(res, 400, errorName || 'Internal server error - 1.2', null)
                        }

                        const modifiedBrandDetails = lodash.omit(insertedBrand, ['brandUserPassword', 'brandLicenseExpiry', 'brandSalt', 'updatedAt', 'createdAt', 'modifiedBy'])
                        return aux.sendResponse(res, 201, `Brand and User inserted successfully ${message ? message : ""} , ${subBrandMessage ? subBrandMessage : ""}.`, modifiedBrandDetails)

                    } catch (error) {
                        console.log(error);
                        const { errorName } = aux.getSequelizeError(error)
                        return aux.sendResponse(res, 400, errorName || 'Internal server error - 2', null)
                    }
                }

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 3', null)
            }
        }
    }
    newmirrarapplicable() {
        return async (req: Request | any, res: Response | any, next?: NextFunction) => {
            let brandId: string = req?.params?.brandId
            if (!brandId) {
                return aux.sendResponse(res, 400, "brand id is missing", {
                    mirrarV2Applicable: false,
                })
            }
            try {
                let response = await brandModel.findByPk(brandId)
                let brandData = response?.dataValues
                if (brandData?.brandActiveStatus == true && brandData?.brandNewMirrarApplicable == true) {
                    return aux.sendResponse(res, 200, "New mirrar applicable", {
                        mirrarV2Applicable: true,
                        currentVersion: '1.0'
                    })
                } else {
                    return aux.sendResponse(res, 400, "New mirrar not applicable", {
                        mirrarV2Applicable: false,
                    })
                }
            } catch (error) {
                console.log(error)
                return aux.sendResponse(res, 400, "Internal server error - Brand Id might not be valid", {
                    mirrarV2Applicable: false,
                })
            }

        }
    }
    updateNewMirrarApplicable() {
        return async (req: Request, res: Response, next?: NextFunction) => {
            try {
                
                let brandId: string = req?.params?.brandId
                let { mirrarV2Applicable = false }: { mirrarV2Applicable: boolean } = req.body
                let response = await brandModel.update({
                    brandNewMirrarApplicable: mirrarV2Applicable
                }, {
                    where: {
                        brandId: brandId,
                        brandActiveStatus: true
                    },
                    returning:  brandQueries.columnNamesExcept(Object.keys(brandModel.getAttributes()) ,['brandUserPassword', 'brandLicenseExpiry', 'brandSalt', 'updatedAt', 'createdAt', 'modifiedBy']) 
                })
                if(response[0] > 0){
                    // affected rows
                    return aux.sendResponse(res,200,`${mirrarV2Applicable ? 'New UI applicable' : 'Old new applicable'}`,response[1]?.[0])
                }else{
                    return aux.sendResponse(res,400,`could not update, check if the toggle is already ${mirrarV2Applicable ? 'on' : 'off'} or check if brand is active`,null)
                }
            } catch (error) {
                console.log(error)
                return aux.sendResponse(res,500,`Internal server error - 235`)
            }
        }
    }

    bulkCreateBrand() {
        return async (req: Request | any, res: Response | any, next?: NextFunction) => {
            let allBrand = req.body;

            if (Array.isArray(allBrand)) {
                let arrayResponse: any = [];
                let i = 0;
                const recursive = (i: number) => {
                    if (allBrand[i]) {
                        let resObj = controller.res();
                        resObj.finalCallback = (obj) => {
                            arrayResponse.push(obj);
                            recursive(i + 1);
                        };
                        controller.createBrand()(
                            {
                                body: allBrand[i],
                            },
                            resObj
                        );
                    } else {
                        // completed the process
                        return aux.sendResponse(
                            res,
                            200,
                            "Brand Bulk Uploaded",
                            arrayResponse
                        );
                    }
                };
                recursive(i);
            } else {
                return aux.sendResponse(res, 400, `Body needs to be an array`, null);
            }
        }
    }

    getBrandDetailsById() {
        return async (req: Request | any, res: Response | any, next?: NextFunction) => {
            try {
                const brandId = req?.params?.brandId
                if (!brandId) return aux.sendResponse(res, 400, "Brand id is required", null)
                const brandDetails = (await brandQueries.getBrandDetailsByBrandId({ brandId }))?.[0]
                const allVariantCodeWhere: FindOptions = {
                    where: {
                        categoryStatus: true,
                        categoryBrandId: brandId
                    },
                    include: [
                        {
                            model: ProductModel,
                            required: true,
                            where: {
                                productBrandId: brandId
                            },
                            attributes: {
                                exclude: Object.keys(ProductModel.getAttributes()),
                                include: ['productId', 'productStatus']
                            },
                            include: [
                                {
                                    model: VariantModel,
                                    required: true,
                                    where: {
                                        variantBrandId: brandId
                                    },
                                    through: {
                                        attributes: []
                                    },
                                    attributes: {
                                        exclude: Object.keys(VariantModel.getAttributes()),
                                        include: ['variantSku', 'variantStatus']
                                    }
                                }
                            ]
                        },

                    ],
                }
                const allProductCode = (await brandQueries.getActiveProductCode(allVariantCodeWhere))
                interface productCode<T> {
                    [key: string]: {
                        type: string
                        categoryLabel: string
                        categoryKey: string
                        categoryMetaJson: string
                        categoryIcon: string
                        categoryId: string
                        categoryParent: string
                        items: T
                    };
                }
                let active_product_codes_set: productCode<Set<string>> = {}
                let disable_product_codes_set: productCode<Set<string>> = {}
                for (let i of allProductCode) {
                    let type = i.dataValues.categoryType
                    let categoryLabel = i.dataValues.categoryLabel
                    let categoryKey = i.dataValues.categoryKey
                    let categoryMetaJson = i.dataValues.categoryMetaJson
                    let categoryIcon = i.dataValues.categoryIcon
                    let categoryId = i.dataValues.categoryId
                    let categoryParent = i.dataValues.categoryParent
                    let categoryImages = i.dataValues.categoryImages
                    let key = categoryKey
                    let emptyObject = {
                        type,
                        categoryLabel,
                        categoryKey,
                        categoryMetaJson,
                        categoryIcon,
                        categoryId,
                        categoryParent,
                        categoryImages
                    }
                    if (!active_product_codes_set[key]) active_product_codes_set[key] = {
                        ...emptyObject, items: new Set()
                    }
                    if (!disable_product_codes_set[key]) disable_product_codes_set[key] = {
                        ...emptyObject, items: new Set()
                    }
                    for (let j of (i.dataValues?.products || [])) {
                        let productStatus = j?.productStatus || false
                        if (productStatus) {
                            j?.variants?.forEach((ele: any) => {
                                let variantStatus = ele?.dataValues?.variantStatus || false
                                let sku = ele?.dataValues?.variantSku
                                if (sku) {
                                    if (variantStatus) {
                                        active_product_codes_set[key].items.add(sku)
                                    } else {
                                        disable_product_codes_set[key].items.add(sku)
                                    }
                                }
                            })
                        } else {
                            // product is disabled
                            j?.variants?.forEach((ele: any) => {
                                let sku = ele?.dataValues?.variantSku
                                if (sku) disable_product_codes_set[key].items.add(sku)
                            })
                        }

                    }

                }

                let active_product_codes: productCode<Array<string>> = {}
                let disable_product_codes: productCode<Array<string>> = {}
                for (let i in active_product_codes_set) {
                    let { items, ...rest } = active_product_codes_set[i]
                    active_product_codes[i] = {
                        ...rest,
                        items: Array.from(items)
                    }
                }
                for (let i in disable_product_codes_set) {
                    let { items, ...rest } = disable_product_codes_set[i]
                    disable_product_codes[i] = {
                        ...rest,
                        items: Array.from(items)
                    }
                }
                let brandJson: any = brandDetails?.[0] || {}
                brandJson.active_product_codes = active_product_codes
                brandJson.disable_product_codes = disable_product_codes

                if (!brandDetails?.length) return aux.sendResponse(res, 200, 'No data found', null)
                return aux.sendResponse(res, 200, `success`, { brandDetails: brandJson })
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 3', null)
            }
        }
    }
    authBrand() {
        return async (req: Request, res: Response, next?: NextFunction) => {
            try {
                const brandDetails = (req as any)["brandDetails"]
                // const brandId = brandDetails?.brandId
                // const categories = (await categoryModel.findAll({
                //     where:{
                //         categoryStatus : true,
                //         categoryBrandId : brandId
                //     },
                //     attributes:{
                //         exclude:brandQueries.columnNamesExcept(Object.keys(categoryModel.getAttributes()),['categoryKey']),
                //     },
                //     order:[['categorySortOrder','asc']]
                // })) || []
                // brandDetails.categories = categories
                return aux.sendResponse(res, 200, "success", brandDetails || null)
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 3', null)
            }
        }
    }

    upsertSubBrandMapping() {
        return async (req: Request | any, res: Response | any, next?: NextFunction) => {
            try {
                const parentBrandId = req.body.parentBrandId;
                const subBrandIdDetails = req.body.subBrandIdDetails;
                const subBrandInsertJson = [];
                for (let eachSubBrandDetails of subBrandIdDetails) {
                    const brandId = eachSubBrandDetails.brandId;
                    let status = eachSubBrandDetails.status;
                    if (status !== false) status = true
                    const obj = {
                        mappingBrandId: parentBrandId,
                        mappingSubBrandId: brandId,
                        mappingStatus: status,
                        modifiedBy: process.env.USER_MODIFIED_BY,
                    };
                    subBrandInsertJson.push(obj);
                }
                if (!subBrandInsertJson.length) {
                    return aux.sendResponse(
                        res,
                        400,
                        "Not single item in the array had valid data",
                        null
                    );
                }
                const subBrandMapConflictCols = ["mappingBrandId", "mappingSubBrandId"];
                const subBrandUpdateCols = ["mappingStatus", "modifiedBy"]
                const response = await brandQueries.upsert(subBrandMappingModel, subBrandInsertJson, subBrandUpdateCols, subBrandMapConflictCols)
                if (response?.length === 0) return aux.sendResponse(res, 400, "No data has been inserted", null)
                else if (response?.length !== subBrandInsertJson.length) return aux.sendResponse(res, 200, "Some of the data has been inserted", null)
                else return aux.sendResponse(res, 201, "All data's are inserted", null)

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 3', null)
            }
        }
    }

    updateBrandStatus() {
        return async (req: Request | any, res: Response | any, next?: NextFunction) => {
            try {
                let status = false
                if (req?.originalUrl.includes("enable")) status = true
                else status = false

                const brandId = req.body.brandId
                let condition = {
                    brandId,
                    brandActiveStatus: !status
                }
                let updateData = { brandActiveStatus: status }
                const brandDetails = await brandQueries.update(brandModel, condition, updateData);

                if (brandDetails?.[0]) return aux.sendResponse(res, 200, "Brand status updated successfully", null)
                return aux.sendResponse(res, 400, "Brand status updated failed", null)

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }
}

const controller = new BrandController()
export default controller;