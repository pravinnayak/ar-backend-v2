import { NextFunction, Request, Response } from "express"

import xlsx from 'node-xlsx'
import aux from '../Utility/auxiliary'
import CategoryQueries from '../DB/queries/CategoryQueries'
import { ProductQueries } from '../DB/queries/ProductQueries'
import { CountOptions, FindOptions, Model, Op, Order, Sequelize, WhereOptions } from 'sequelize'
import ProductVariantMappingModel from '../Model/productVariantMappingModel'
import ProductModel from "../Model/productModel";
import CategoryModel from "../Model/categoryModel"
import VariantModel from "../Model/variantModel"
import SetMapping from "../Model/setModel"
import AdmZip from "adm-zip"
import path from "path"
import fs from "fs"
import S3 from "aws-sdk/clients/s3"
import fsE from 'fs-extra'
import { randomUUID } from "crypto"


interface ProductSheetUploadHeaderJson {
    [key: string]: string;
    'Product Handle': string;
    'Product Status': string;
    'Product Images': string;
    'Product Title': string;
    'Product Collection': string;
    'Product Meta': string;
    'Variant Sku': string;
    'Variant Title': string;
    'Variant Description': string;
    'Variant Status': string;
    'Variant Thumbnail': string;
    'Variant Image': string;
    'Variant Tags': string;
    'Variant Site Link': string;
    'Variant Price': string;
    'Variant Compare Price': string;
    'Variant Meta': string;
    'Variant Data': string;
    'Variant Filter': string;
    'Variant isSet': string;
    'Variant Inventory': string;
    'Variant Height': string;
    'Variant XOffset': string;
    'Variant YOffset': string;
    'Variant Set Mapping': string;
}

interface JsonColumnTypeInDb {
    [key: string]: string;
    'Product Meta': string;
    'Variant Meta': string;
    'Variant Data': string;
    'Variant Filter': string;
    'Variant Inventory': string;
    'Variant Height': string;
    'Variant Thumbnail': string;
    'Variant Image': string;
    'Variant XOffset': string;
    'Variant YOffset': string;
    'Variant Set Mapping': string;
}

class ProductController {
    productSheetUploadHeaderJson: ProductSheetUploadHeaderJson;
    jsonColumnTypeInDb: JsonColumnTypeInDb;
    productSheetUploadHeaderArray: string[];

    constructor() {
        this.productSheetUploadHeaderJson = {
            'Product Handle': 'productHandle',
            'Product Status': 'productStatus',
            'Product Images': 'productImages',
            'Product Title': 'productTitle',
            'Product Collection': 'productCollection',
            'Product Meta': 'productMetaJSON',
            'Variant Sku': 'variantSku',
            'Variant Title': 'variantTitle',
            'Variant Description': 'variantDescription',
            'Variant Status': 'variantStatus',
            'Variant Thumbnail': 'variantThumbnails',
            'Variant Image': 'variantImageURLs',
            'Variant Tags': 'variantTags',
            'Variant Site Link': 'variantWebsiteLink',
            'Variant Price': 'variantPrice',
            'Variant Compare Price': 'variantCompareAtPrice',
            'Variant Meta': 'variantMetaJSON',
            'Variant Data': 'variantData',
            'Variant Filter': 'variantFilter',
            'Variant isSet': 'variantIsSetOnly',
            'Variant Inventory': 'variantInventory',
            'Variant Height': 'variantHeight',
            'Variant XOffset': 'variantXoffset',
            'Variant YOffset': 'variantYoffset',
            'Variant Set Mapping': 'variantSetMappingIds'
        };

        this.jsonColumnTypeInDb = {
            'Product Meta': 'productMetaJSON',
            'Variant Meta': 'variantMetaJSON',
            'Variant Data': 'variantData',
            'Variant Filter': 'variantFilter',
            'Variant Inventory': 'variantInventory',
            'Variant Height': 'variantHeight',
            'Variant Thumbnail': 'variantThumbnails',
            'Variant Image': 'variantImageURLs',
            'Variant XOffset': 'variantXoffset',
            'Variant YOffset': 'variantYoffset',
            'Variant Set Mapping': 'variantSetMappingIds'
        };

        this.productSheetUploadHeaderArray = Object.keys(this.productSheetUploadHeaderJson);
    }
    uploadInventorySheet() {
        /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const brandDetails = (req as any)['brandDetails']
                const subBrandDetails = (req as any)['subBrandDetails']
                const brandId = brandDetails.uuid || brandDetails.brandId
                const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId
                let path = req.file?.path || ""
                const workSheetsFromFile = xlsx.parse(path, {
                    blankrows: false
                });
                aux.deleteFile(path)
                let whereClauseForCategory: WhereOptions = {
                    categoryBrandId: brandId,
                    categoryStatus: true
                }
                let orderBy: Order = [['categorySortOrder', 'ASC']]
                let categories: Model[] = await CategoryQueries.getCategoriesBasedOnWhere(whereClauseForCategory, orderBy)
                let errorObject = []
                for (let eachSheet of workSheetsFromFile) {
                    let sheetName = eachSheet.name
                    console.log(sheetName, "sheetname processin")
                    let categoryNameToSheetNameIndex = categories.findIndex(ele => {
                        return ele.dataValues.categoryKey == sheetName
                    })

                    if (categoryNameToSheetNameIndex > -1) {
                        let data: any[] = eachSheet.data
                        let headers: any[] = data.shift()
                        let headersToColumn: any = {}
                        let isSet = categories[categoryNameToSheetNameIndex].dataValues.categoryIsSet == true ? true : false
                        let categoryId = categories[categoryNameToSheetNameIndex].dataValues.categoryId
                        let headerJson: any = this.productSheetUploadHeaderJson
                        let jsonColumnType: any = this.jsonColumnTypeInDb

                        for (let i = 0; i < headers.length; i++) {
                            let headerName: string = headers[i]?.trim?.()
                            let cleanedheaderName = headerName?.split?.('-')?.[0]?.trim?.()
                            // console.log(headerName)
                            if (headerJson[headerName] || (jsonColumnType[cleanedheaderName])) {
                                // this belongs to the supported headers for product
                                // or it belongs to a json type of the column
                                let actualColumnName = headerJson[headerName] || jsonColumnType[cleanedheaderName]
                                if (jsonColumnType[cleanedheaderName]) {
                                    // this column can be split into many sub columns
                                    let splitHeader = headerName?.split?.('-')
                                    splitHeader.shift()
                                    let secondPart = splitHeader.map(ele => ele?.trim())?.join(".")
                                    let derivedColumnName = actualColumnName + "." + secondPart
                                    headersToColumn[i] = derivedColumnName
                                } else {
                                    headersToColumn[i] = actualColumnName
                                }
                            }
                            if (cleanedheaderName == "Variant Set Mapping" && (jsonColumnType[cleanedheaderName]) && isSet) {
                                // the sheet is a set sheet, with variant sku colum
                                let splitHeader = headerName?.split?.('-')
                                let categoryName = splitHeader?.pop?.()
                                console.log(categoryName, "category name from header")
                                let obj = categories.find(ele => ele.dataValues.categoryKey == categoryName)
                                if (!obj) {
                                    errorObject.push({
                                        sheet: sheetName,
                                        errorType: 'sheetError',
                                        message: `${sheetName} Not Process as category Name - "${categoryName}" present in the header - "${headerName}" does not exists in the brand`
                                    })
                                    continue;
                                }
                            }
                        }

                        console.log(headersToColumn, "this will have header with the column value")
                        let columnsToUpdate: any = Object.values(headersToColumn);
                        const essentialColumns = ['variantSku', 'productHandle', 'productCategoryId', 'variantCategoryId', 'productBrandId', 'variantBrandId'];
                        columnsToUpdate = [...new Set([...columnsToUpdate, ...essentialColumns])];

                        let bulkInsertProduct = []
                        let productMap = new Map()
                        let variantMap = new Map()
                        let uniqueVariantSku = new Map()
                        for (let i = 0; i < data.length; i++) {
                            let upsertParentObject: any = {}
                            let eachRow = data[i]
                            eachRowLoop: for (let j = 0; j < eachRow.length; j++) {
                                upsertParentObject[headersToColumn[j]] = eachRow[j]?.trim?.() || (eachRow[j] || null) // responsible for cleaning of each cell
                                // below is the code to validate each header
                                switch (headersToColumn[j]) {
                                    case 'productHandle':
                                        if (upsertParentObject[headersToColumn[j]]?.includes(" ")) {
                                            errorObject.push({
                                                sheet: sheetName,
                                                type: 'rowError',
                                                message: `Space in - '${upsertParentObject[headersToColumn[j]]}' not allowed, Row number - ${i + 1}`
                                            })
                                            upsertParentObject = {}
                                            break eachRowLoop;
                                        }
                                        break;
                                    case 'productStatus':
                                    case 'variantStatus':
                                        upsertParentObject[headersToColumn[j]] = upsertParentObject[headersToColumn[j]] != "active" ? false : true
                                        break;
                                    case 'variantIsSetOnly':
                                        upsertParentObject[headersToColumn[j]] = upsertParentObject[headersToColumn[j]]?.toLowerCase?.() == 'yes' ? true : false
                                        break;
                                    case 'productImages':
                                    // case 'variantThumbnails':
                                    // case 'variantImageURLs':
                                    case 'variantTags':
                                        upsertParentObject[headersToColumn[j]] = Array.isArray(upsertParentObject[headersToColumn[j]]) ? upsertParentObject[headersToColumn[j]] : (upsertParentObject[headersToColumn[j]]?.split?.(',') || null)
                                        break;
                                    // case headersToColumn[j]?.match(/Variant Sku\s*-\s*(\w+)/)?.input:
                                    //     // dynamic 
                                    //     break;
                                    default:
                                        break;
                                }
                            }
                            if (Object.keys(upsertParentObject).length) {
                                upsertParentObject['productBrandId'] = upsertParentObject['variantBrandId'] = brandId
                                upsertParentObject['productSubBrandId'] = subBrandId || null
                                upsertParentObject['modifiedBy'] = aux.getSignedInUser(req)
                                upsertParentObject['productCategoryId'] = upsertParentObject['variantCategoryId'] = categoryId
                                // any category that is not set will have the product is mapping set to empty json
                                if (!isSet) upsertParentObject['variantSetMappingIds'] = null

                                if (isSet) {
                                    let keys = Object.keys(upsertParentObject)
                                    let match = keys.find(ele => ele.match(/variantSetMappingIds\..?/gi))
                                    if (!match) {
                                        errorObject.push({
                                            sheet: sheetName,
                                            type: 'rowError',
                                            message: `Category Type is set but mapping is not being uploaded Row no. ${i + 1}`
                                        })
                                        upsertParentObject = {}
                                        continue;
                                    } else {
                                        let keys = Object.keys(upsertParentObject)
                                        for (let key of keys) {
                                            // console.log(key, "column keys")
                                            if (key.match(/variantSetMappingIds\..?/gi)) {
                                                let categoryName = key.split('.').pop()
                                                let obj: any = categories.find(ele => ele.dataValues.categoryKey == categoryName)
                                                let sku = upsertParentObject[key]
                                                if (obj && sku) {
                                                    let key = sku + brandId + obj.categoryId
                                                    uniqueVariantSku.set(key, {
                                                        variantSku: sku,
                                                        variantBrandId: brandId,
                                                        variantCategoryId: obj.categoryId
                                                    })
                                                }
                                            }
                                        }
                                    }

                                }

                                productMap.set(upsertParentObject['productHandle'] + '-' + upsertParentObject['productCategoryId'], upsertParentObject)
                                let variantKey = upsertParentObject['variantSku'] + upsertParentObject['variantCategoryId']
                                // if (!isSet) {
                                if (!variantMap.has(variantKey)) {
                                    variantMap.set(variantKey, upsertParentObject)
                                    bulkInsertProduct.push(upsertParentObject)
                                } else {
                                    errorObject.push({
                                        sheet: sheetName,
                                        type: 'rowError',
                                        message: `Variant Sku - ${upsertParentObject['variantSku']} repeated within same category, Row - ${i + 1}`
                                    })
                                }
                                // }
                                // bulkInsertProduct.push(upsertParentObject)
                            }
                        }
                        try {

                            // console.log(uniqueVariantSku, "uniqueVariantSku")
                            if (uniqueVariantSku.size) {
                                let where: any = {}
                                for (let item of uniqueVariantSku.values()) {
                                    where[Op.or] = item
                                }
                                let variantIsMapping = await ProductQueries.getVariantDetails(where)
                                for (let i = 0; i < bulkInsertProduct.length; i++) {
                                    let eachParent = bulkInsertProduct[i]
                                    let keys = Object.keys(eachParent)
                                    let variantIds = []
                                    let keysToDelete = []
                                    for (let key of keys) {
                                        if (key.match(/variantSetMappingIds\..?/gi)) {
                                            let categoryName = key.split('.').pop()
                                            let obj: any = categories.find(ele => ele.dataValues.categoryKey == categoryName)
                                            let sku = eachParent[key]
                                            if (obj && sku) {
                                                let variant: any = variantIsMapping.find((ele: Model) => ele.dataValues.variantSku == sku && ele.dataValues.variantCategoryId == obj.categoryId)
                                                if (variant?.variantId) {
                                                    variantIds.push(variant?.variantId)
                                                    keysToDelete.push(key)
                                                }
                                            }
                                        }
                                    }
                                    if (variantIds.length) {
                                        for (let j of keysToDelete) {
                                            delete bulkInsertProduct[i][j]
                                        }
                                        bulkInsertProduct[i].variantSetMappingIds = variantIds
                                    }
                                }
                            }
                            // console.log(JSON.stringify(bulkInsertProduct), "bulkInsert Product")
                            console.log("columnsToUpdate: ", columnsToUpdate);
                            let productResponse: Model[] = await ProductQueries.bulkUpsertProductDetails(
                                Array.from(productMap.values()),
                                columnsToUpdate
                            );
                            let variantReponse = await ProductQueries.bulkUpsertVariantDetails(
                                bulkInsertProduct,
                                columnsToUpdate
                            );

                            if (!productResponse.length || !variantReponse.length) {
                                return aux.sendResponse(res, 400, "Something went wrong as no rows were updated", {
                                    errorObject
                                })
                            }

                            // rows have been updated
                            let bulkInsertMapping = []
                            let bulkInsertSetMapping = []
                            for (let i of bulkInsertProduct) {
                                let object: any = {}
                                let productHandle = i.productHandle
                                let productCategoryId = i.productCategoryId
                                let variantSku = i.variantSku
                                let variantCategoryId = i.variantCategoryId
                                let productIdx = productResponse.findIndex(ele => {
                                    return ele.dataValues.productHandle == productHandle && ele.dataValues.productCategoryId == productCategoryId
                                })
                                if (productIdx > -1) {
                                    let productId = productResponse[productIdx].dataValues.productId
                                    let variantIdx = variantReponse.findIndex((ele: Model) => (ele.dataValues.variantSku == variantSku && ele.dataValues.variantCategoryId == variantCategoryId))
                                    if (variantIdx > -1) {
                                        let variantId = variantReponse[variantIdx].dataValues.variantId
                                        object['productProductId'] = productId
                                        object['variantVariantId'] = variantId
                                        object['mappingStatus'] = true


                                        if (isSet && i?.variantSetMappingIds?.length) {
                                            // insert into set mapping
                                            let variantVariantId = variantId
                                            for (let setChildVariantId of i?.variantSetMappingIds) {
                                                bulkInsertSetMapping.push({
                                                    variantVariantId,
                                                    setChildVariantId
                                                })
                                            }
                                        }

                                    } else {
                                        errorObject.push({
                                            sheet: sheetName,
                                            type: 'mappingError',
                                            message: `Variant Sku - ${variantSku} could not be found in mapping`
                                        })
                                    }
                                } else {
                                    errorObject.push({
                                        sheet: sheetName,
                                        type: 'mappingError',
                                        message: `Product Handle - ${productHandle} could not be found in mapping`
                                    })
                                }
                                if (Object.keys(object).length) {
                                    bulkInsertMapping.push(object)
                                }
                            }
                            let response = await ProductQueries.bulkInsertProductVariantMapping(bulkInsertMapping)
                            if (!response.length) {
                                errorObject.push({
                                    sheet: sheetName,
                                    type: 'sheetError',
                                    message: "Something went wrong while mapping objects"
                                })
                                continue
                            }
                            if (isSet) {
                                let bulkInsertSetMappingResponse = await SetMapping.bulkCreate(bulkInsertSetMapping, {
                                    returning: true,
                                    updateOnDuplicate: ["setChildVariantId"],
                                    conflictAttributes: ["variantVariantId", "setChildVariantId"],
                                })
                                if (!bulkInsertSetMappingResponse.length) {
                                    errorObject.push({
                                        sheet: sheetName,
                                        type: 'sheetError',
                                        message: "Set Mapping could not be completed"
                                    })
                                    continue
                                }
                            }

                            // console.log(findResponse)

                            // process variant


                        } catch (error) {
                            console.log(error)
                            return aux.sendResponse(res, 400, "Internal server error", {
                                errorObject
                            })
                        }
                    } else {
                        errorObject.push({
                            sheet: sheetName,
                            errorType: 'sheetError',
                            message: `${sheetName} might be incorrect as it does not match any categories for the brand`
                        })
                    }
                }
                console.log(errorObject)
                return aux.sendResponse(res, 200, "Sheet Updated", {
                    errorObject
                })
            }
            catch (error) {
                console.log(error)
            }


        }
    }
    fetchInventories() {
        /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const brandDetails = (req as any)['brandDetails']
                const subBrandDetails = (req as any)['subBrandDetails']
                const brandId = brandDetails.uuid || brandDetails.brandId
                const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId
                let category: string | null = req.params.categories
                const term: string = req.params.term || ""
                console.log(category, "category")
                /**
                 * {
                            "limit": 100,
                            "filter_field": {
                                "disable": 0,
                                "availableFilter":[
                                    {
                                        "contest1": ["newContest"]
                                    }
                                ]
                            }
                        }
                 */
                let {
                    limit = 20,
                    product_code = null,
                    filter_field = {},
                }: { limit: number, product_code: string | null | Array<string>, filter_field: any } = req.body
                let {
                    disable = 0,
                    isSetOnly = [true, false],
                    page = 1,
                    sort_field,
                    sort_by,
                    calibrate = 0,
                    qcCalibration = 0,
                    appliedFilter = []
                }: {
                    disable: number,
                    isSetOnly: boolean[] | null,
                    page: number, sort_field: string | undefined,
                    sort_by: string | undefined,
                    calibrate: number,
                    qcCalibration: number,
                    appliedFilter: any
                } = filter_field

                let isCalibrated = [true, false]
                if (calibrate == 1) isCalibrated = [true]
                else if (calibrate == 2) isCalibrated = [false]
                // console.log(isCalibrated)

                let isQCCalibrated = [true, false]
                if (qcCalibration == 1) isQCCalibrated = [true]
                else if (qcCalibration == 2) isQCCalibrated = [false]

                let categoryDetail: Model
                let categoryIsSet: boolean = false
                if (category == "nocategory") {
                    category = null
                } else {
                    // get categoryDetails
                    let categoryFindClause: FindOptions = {
                        where: {
                            categoryKey: category,
                            categoryBrandId: brandId,
                            categoryStatus: true
                        },
                        limit: 1,
                        attributes: {
                            exclude: ['categoryMetaJson']
                        }
                    };
                    [categoryDetail] = await CategoryModel.findAll(categoryFindClause)
                    categoryIsSet = categoryDetail.dataValues?.categoryIsSet
                    if (categoryIsSet) {
                        // force the code sent the is setonly variants as well
                        isSetOnly = [true, false]
                    }
                }
                let offset = (page - 1) * limit
                let query: any = {
                    category,
                    brandId,
                    status: [true],
                    customWhere: [
                        isSetOnly ? `AND v."variantIsSetOnly" IN (${isSetOnly})` : ''
                    ]
                }

                if (disable == 1) {
                    query.status = [true, false]
                }
                let status = query.status

                let variantIdOrder: Array<number> = []
                let productIdOrder: Array<number> = []
                let allVariantIds: Array<number> = []
                let collectionFromProductCode = null
                let onlyProductCodes = true
                if (product_code) {
                    if (!Array.isArray(product_code)) {
                        onlyProductCodes = false
                        product_code = [product_code]
                    }
                    // Fetch the Product That has the product code requested
                    let whereClause: FindOptions = {
                        include: [
                            {
                                model: ProductModel,
                                required: true,
                                duplicating: false,
                                where: {
                                    productStatus: status,
                                    productBrandId: brandId,
                                },
                                through: {
                                    attributes: []
                                },
                                include: [
                                    (
                                        category ?
                                            {
                                                model: CategoryModel,
                                                required: true,
                                                duplicating: false,
                                                where: {
                                                    categoryKey: category,
                                                    categoryBrandId: brandId,
                                                    categoryStatus: true
                                                },
                                                attributes: {
                                                    exclude: ['categoryMetaJson']
                                                }
                                            }
                                            : {
                                                model: CategoryModel,
                                                required: true,
                                                duplicating: false,
                                                where: {
                                                    categoryBrandId: brandId,
                                                    categoryStatus: true
                                                },
                                                attributes: {
                                                    exclude: ['categoryMetaJson']
                                                }
                                            }
                                    ),
                                    {
                                        duplicating: false,
                                        model: VariantModel,
                                        through: {
                                            attributes: []
                                        },
                                        where: {
                                            variantBrandId: brandId,
                                            variantStatus: status,
                                            variantIsSetOnly: isSetOnly,
                                            variantIsCalibrated: isCalibrated,
                                            variantIsQCCalibrated: isQCCalibrated,
                                        },
                                        include: [
                                            {
                                                model: VariantModel,
                                                duplicating: false,
                                                as: 'setChild',
                                                include: [
                                                    {
                                                        model: CategoryModel,
                                                        duplicating: false,
                                                        required: true,
                                                        where: {
                                                            categoryBrandId: brandId,
                                                            categoryStatus: true
                                                        },
                                                        attributes: {
                                                            exclude: ['categoryMetaJson']
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                            },
                        ],
                        where: {
                            variantSku: product_code,
                            variantBrandId: brandId,
                            variantStatus: status,
                            variantIsSetOnly: isSetOnly,
                            variantIsCalibrated: isCalibrated,
                            variantIsQCCalibrated: isQCCalibrated,
                        },
                        order: [
                            Sequelize.literal(aux.orderByArray(product_code.map(ele => ['"variant"."variantSku"', ele])))
                        ]
                    }

                    let responseForSKu = await ProductQueries.getVariantDetailsSequelize(whereClause)
                    // console.log(responseForSKu, "product code fetch")
                    // return aux.sendResponse(res, 200, "Success", responseForSKu)
                    responseForSKu?.forEach?.(ele => {
                        variantIdOrder.push(ele.dataValues.variantId)
                    })
                    for (let i of responseForSKu) {
                        let productId = i?.dataValues?.products?.[0]?.productId
                        productIdOrder.push(productId)
                        for (let j of i?.dataValues?.products?.[0]?.variants) {
                            allVariantIds.push(j.variantId)
                        }
                    }
                    if (responseForSKu?.[0]?.dataValues?.products?.[0]) {
                        collectionFromProductCode = responseForSKu[0].dataValues.products[0]?.productCollection || ""
                        // console.log(collectionFromProductCode,"collectionFromProductCode")
                    }
                } else {
                    // if product code is not defined
                    onlyProductCodes = false
                }
                const termObject: any = {}
                if (term) {
                    termObject[Op.or] = {
                        "$variants.variantSku$": {
                            [Op.iLike]: `%${term}%`
                        },
                        "$variants.variantTitle$": {
                            [Op.like]: `%${term}%`
                        },
                        "productHandle": {
                            [Op.like]: `%${term}%`
                        },
                        "productTitle": {
                            [Op.like]: `%${term}%`
                        }
                    }
                }
                // for single product try on
                if (onlyProductCodes) {
                    termObject[Op.and] = {
                        "$variants.variantId$": {
                            [Op.in]: allVariantIds
                        }
                    }
                }

                // only true or false is applied
                // by default both are applied hence they do not need to be added to the term condition
                if (isCalibrated.length == 1) {
                    termObject[Op.and] = {
                        "$variants.variantIsCalibrated$": {
                            [Op.in]: isCalibrated
                        }
                    }
                }

                if (isQCCalibrated.length == 1) {
                    termObject[Op.and] = {
                        "$variants.variantIsQCCalibrated$": {
                            [Op.in]: isQCCalibrated
                        }
                    }
                }

                let countProductClause: CountOptions = {
                    include: [
                        {
                            model: VariantModel,
                            required: true,
                            duplicating: false,
                            through: {
                                attributes: []
                            },
                            attributes: [],
                            where: {
                                variantStatus: true,
                                variantBrandId: brandId,
                                variantIsSetOnly: isSetOnly,
                                variantIsCalibrated: isCalibrated,
                                variantIsQCCalibrated: isQCCalibrated,
                            }
                        },
                        (
                            category ?
                                {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryKey: category,
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: ['categoryMetaJson']
                                    }
                                }
                                : {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: ['categoryMetaJson']
                                    }
                                }
                        ),
                    ],
                    where: {
                        productStatus: status,
                        productBrandId: brandId,
                        ...termObject
                    },
                    distinct: true,
                    col: 'productId',
                }
                let count = await ProductQueries.getProductCountSequelize(countProductClause)


                let countVariantClause: CountOptions = {
                    include: [
                        {
                            model: VariantModel,
                            required: true,
                            duplicating: false,
                            through: {
                                attributes: []
                            },
                            attributes: [],
                            where: {
                                variantStatus: true,
                                variantBrandId: brandId,
                                variantIsSetOnly: isSetOnly,
                                variantIsCalibrated: isCalibrated,
                                variantIsQCCalibrated: isQCCalibrated,
                            }
                        },
                        (
                            category ?
                                {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryKey: category,
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: ['categoryMetaJson']
                                    }
                                }
                                : {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: ['categoryMetaJson']
                                    }
                                }
                        ),
                    ],
                    where: {
                        productStatus: status,
                        productBrandId: brandId,
                        ...termObject
                    },
                }
                let total_variant_record = await ProductQueries.getProductCountSequelize(countVariantClause)

                let orderbyStr = aux.orderByArray([
                    ...variantIdOrder.map(ele => ['"variants"."variantId"', ele]),
                    ['"product"."productCollection"', (collectionFromProductCode || "asc")]
                ])
                let orderbyStrProduct = aux.orderByArray([
                    ...productIdOrder.map(ele => ['"product"."productId"', ele]),
                    ['"product"."productCollection"', (collectionFromProductCode || "asc")]
                ])

                let wherClauseForProduct = {
                    productStatus: status,
                    productBrandId: brandId,
                    ...termObject
                }
                let productOrderByClause: Order = [
                    Sequelize.literal(orderbyStr),
                    ['createdAt', 'desc']
                ]
                let productFetchOrderByClause: Order = [
                    Sequelize.literal(orderbyStrProduct),
                    ['createdAt', 'desc']
                ]
                let productIdsWhere: FindOptions = {
                    attributes: {
                        exclude: Object.keys(ProductModel.getAttributes()),
                        include: ['productId']
                    },
                    include: [
                        {
                            model: VariantModel,
                            duplicating: false,
                            attributes: {
                                exclude: Object.keys(VariantModel.getAttributes())
                            },
                            where: {
                                variantBrandId: brandId,
                                variantStatus: status,
                                variantIsSetOnly: isSetOnly,
                                variantIsCalibrated: isCalibrated,
                                variantIsQCCalibrated: isQCCalibrated,
                            },
                            through: {
                                attributes: []
                            },
                            order: [['variantOrderId', 'asc']],
                        },
                        (
                            category ?
                                {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryKey: category,
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: Object.keys(CategoryModel.getAttributes())
                                    }
                                }
                                : {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: Object.keys(CategoryModel.getAttributes())
                                    }
                                }
                        ),
                    ],
                    where: wherClauseForProduct,
                    order: productFetchOrderByClause,
                    limit: limit,
                    offset: offset,
                    // logging: console.log,
                    group: "productId"
                }
                let productIdResponse = await ProductQueries.getProductDetailsSequelize(productIdsWhere)
                let productIds: Array<number> = []
                productIdResponse.map(ele => {
                    productIds.push(Number(ele.dataValues.productId))
                })
                wherClauseForProduct.productId = {
                    [Op.in]: productIds
                }
                // console.log(wherClauseForProduct, "wherClauseForProduct")
                let productFetchWhereClause: FindOptions = {
                    include: [
                        {
                            model: VariantModel,
                            duplicating: false,
                            where: {
                                variantBrandId: brandId,
                                variantStatus: status,
                                variantIsSetOnly: isSetOnly,
                                variantIsCalibrated: isCalibrated,
                                variantIsQCCalibrated: isQCCalibrated,
                            },
                            through: {
                                attributes: []
                            },
                            order: [['variantOrderId', 'asc']],
                            include: [
                                {
                                    model: VariantModel,
                                    duplicating: false,
                                    as: 'setChild',
                                    include: [
                                        {
                                            model: CategoryModel,
                                            duplicating: false,
                                            required: true,
                                            where: {
                                                categoryBrandId: brandId,
                                                categoryStatus: true
                                            },
                                            attributes: {
                                                exclude: ['categoryMetaJson']
                                            }
                                        }
                                    ],
                                    required: categoryIsSet
                                }
                            ]
                        },
                        (
                            category ?
                                {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryKey: category,
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: ['categoryMetaJson']
                                    }
                                }
                                : {
                                    model: CategoryModel,
                                    required: true,
                                    duplicating: false,
                                    where: {
                                        categoryBrandId: brandId,
                                        categoryStatus: true
                                    },
                                    attributes: {
                                        exclude: ['categoryMetaJson']
                                    }
                                }
                        ),
                    ],
                    where: wherClauseForProduct,
                    // logging: console.log,
                    // limit: limit,
                    // offset: offset,
                    order: productOrderByClause,
                }

                let responseProduct = await ProductQueries.getProductDetailsSequelize(productFetchWhereClause)


                let total = count
                let totalPages = Math.ceil(total / limit)
                let meta = {
                    current_page: page,
                    error_code: '',
                    has_more_pages: totalPages > page ? true : false,
                    message: "Success",
                    total,
                    total_variant_record,
                    totalPages
                }

                aux.sendResponse(res, 200, "Success", {
                    data: responseProduct,
                    meta
                })



            } catch (error) {
                console.log(error)
            }
        }
    }

    productExcelDownload() {
        /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const brandDetails = (req as any)['brandDetails'];
                const subBrandDetails = (req as any)['subBrandDetails'];
                const brandId = brandDetails.uuid || brandDetails.brandId;
                const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId;
                const brandName = brandDetails?.brandAliasName || `${brandId}-product-sheet`;
                if (!brandDetails) {
                    return aux.sendResponse(res, 400, "brandDetails is required", null);
                }
                const where: WhereOptions = {
                    productBrandId: brandId,
                    productStatus: true,
                };
                if (subBrandId) {
                    where.productSubBrandId = subBrandId;
                }
    
                const products = await ProductQueries.getProductDetailsSequelize({
                    where,
                    include: [
                        {
                            model: VariantModel,
                            through: { attributes: [] },
                            include: [{ model: CategoryModel }]
                        },
                        { model: CategoryModel }
                    ],
                    order: [['createdAt', 'ASC']]
                });
    
                const categorizedProducts: { [key: string]: any[][] } = {};
    
                const additionalHeaders = [
                    'Variant Meta-faceWidth',
                    'Variant Meta-faceHeight',
                    'Variant Meta-model',
                    'Variant Meta-scalingFactor',
                    'Variant ImageURLs',
                    'Variant Thumbnails',
                    'Variant Inventory-gender',
                    'Variant Height-0',
                    'Variant Height-1',
                    'Variant Xoffset-0',
                    'Variant Xoffset-1',
                    'Variant Yoffset-0',
                    'Variant Yoffset-1'
                ];
    
                const headerSet = new Set([...this.productSheetUploadHeaderArray, ...additionalHeaders]);
                this.productSheetUploadHeaderArray = Array.from(headerSet).filter(header => 
                    !['Variant Meta', 'Variant Height', 'Variant XOffset', 'Variant YOffset', 'Variant Inventory'].includes(header)
                );
    
                products.forEach((product: Model) => {
                    const productData = product.get();
                    const variants = productData.variants || [];
                    const category = productData.category?.categoryKey || 'nocategory';
    
                    if (!categorizedProducts[category]) {
                        categorizedProducts[category] = [this.productSheetUploadHeaderArray];
                    }
    
                    variants.forEach((variant: any) => {
                        const row = this.productSheetUploadHeaderArray.map(header => {
                            const key = this.productSheetUploadHeaderJson[header];
                            let value = productData[key] || variant[key] || '';
    
                            if (header.startsWith('Variant Meta-')) {
                                const metaKey = header.replace('Variant Meta-', '').toLowerCase();
                                value = variant.variantMetaJSON ? variant.variantMetaJSON[metaKey] || '' : '';
                            } else if (header === 'Variant ImageURLs') {
                                value = variant.variantImageURLs ? Object.values(variant.variantImageURLs).join(',') : '';
                            } else if (header === 'Variant Thumbnails') {
                                value = variant.variantThumbnails ? Object.values(variant.variantThumbnails).join(',') : '';
                            } else if (header.startsWith('Variant Inventory-')) {
                                const inventoryKey = header.replace('Variant Inventory-', '').toLowerCase();
                                value = variant.variantInventory ? variant.variantInventory[inventoryKey] || '' : '';
                            } else if (header.startsWith('Variant Height-')) {
                                const heightIndex = header.replace('Variant Height-', '');
                                value = variant.variantHeight ? variant.variantHeight[heightIndex] || '' : '';
                            } else if (header.startsWith('Variant Xoffset-')) {
                                const xoffsetIndex = header.replace('Variant Xoffset-', '');
                                value = variant.variantXoffset ? variant.variantXoffset[xoffsetIndex] || '' : '';
                            } else if (header.startsWith('Variant Yoffset-')) {
                                const yoffsetIndex = header.replace('Variant Yoffset-', '');
                                value = variant.variantYoffset ? variant.variantYoffset[yoffsetIndex] || '' : '';
                            } else if (Array.isArray(value)) {
                                value = value.join(',');
                            } else if (typeof value === 'object' && value !== null) {
                                if (value.hasOwnProperty('0')) {
                                    value = value['0'];
                                } else {
                                    value = JSON.stringify(value);
                                }
                            } else if (typeof key === 'string' && key.toLowerCase().includes('status')) {
                                value = value === true || value === 'active' ? 'active' : 'disable';
                            }
                            return value;
                        });
                        categorizedProducts[category].push(row);
                    });
                });
                const sheets = Object.entries(categorizedProducts).map(([name, data]) => ({
                    name,
                    data,
                    options: {}
                }));
                const buffer = xlsx.build(sheets);
                const filePath = path.join(__dirname, `${brandName}.xlsx`);
    
                fs.writeFileSync(filePath, buffer, 'utf-8');
    
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=${brandName}.xlsx`);
                res.setHeader('Access-Control-Allow-Origin', '*');
    
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
    
                fileStream.on('close', () => {
                    aux.deleteFile(filePath);
                });
    
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                if (res.headersSent) {
                    console.error('Headers already sent, cannot send response.');
                } else {
                    return aux.sendResponse(res, 400, errorName || 'Internal server error - 1158', null);
                }
            }
        }
    }

    saveCalibrationDetails() {
        /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const brandDetails = (req as any)['brandDetails']
                const subBrandDetails = (req as any)['subBrandDetails']
                const brandId = brandDetails.uuid || brandDetails.brandId
                const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId

                interface CalibrationDetails {
                    variantMetaJSON: Record<string | number, any>
                    variantHeight: Record<string | number, any>
                    variantXoffset: Record<string | number, any>
                    variantYoffset: Record<string | number, any>
                    variantIsCalibrated?: Boolean
                    variantIsQCCalibrated?: Boolean
                }
                const variantSKU: string = req?.params?.variantSku;
                const category: string = req?.params?.categories;
                const calibrationDetails: CalibrationDetails = req?.body;
                const isQCCalibratedParam: boolean = req?.body?.isQCCalibrated || false;
                // pass true by default
                calibrationDetails.variantIsCalibrated = true
                calibrationDetails.variantIsQCCalibrated = isQCCalibratedParam
                const matchCondition = {
                    categoryKey: category,
                    categoryStatus: true,
                    categoryBrandId: brandId
                }
                const categoryDetails = (await ProductQueries.getSingleDataByCondition(CategoryModel, matchCondition))?.dataValues
                if (!categoryDetails?.categoryId) return aux.sendResponse(res, 200, "Category not found", null)
                const categoryId = categoryDetails?.categoryId
                const variantCondition = {
                    variantSku: variantSKU,
                    variantBrandId: brandId,
                    variantCategoryId: categoryId
                }

                // console.log(variantCondition,calibrationDetails)
                const updatedDetails = await ProductQueries.update(VariantModel, variantCondition, calibrationDetails);
                if (!updatedDetails?.[0]) return aux.sendResponse(res, 400, "Updation failed", null)
                return aux.sendResponse(res, 200, "Calibration successfully updated."), null

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }

    convertImagesToS3Url() {
        return async (req: Request, res: Response, next: NextFunction) => {
            const brandDetails = (req as any)["brandDetails"];
            const subBrandDetails = (req as any)["subBrandDetails"];
            const brandId = brandDetails?.uuid || brandDetails?.brandId;
            const brandName = brandDetails?.brandAliasName || brandId

            try {
                const uuid = randomUUID()
                const assetPath = `../assets/images/${uuid}/`
                const zipPath = path.join(__dirname, "../" + req?.file?.filename)
                fs.mkdirSync(path.join(__dirname, assetPath), { recursive: true })
                const extractToPath = path.join(__dirname, assetPath)
                const zip = new AdmZip(zipPath);

                zip.extractAllTo(extractToPath, true);
                const folderName = fs.readdirSync(extractToPath)?.pop()
                const extractedFiles = fs.existsSync(extractToPath + "/" + folderName) ? fs.readdirSync(extractToPath + "/" + folderName) : fs.readdirSync(extractToPath)
                aux.deleteFile(zipPath)

                const s3 = new S3({
                    region: process?.env?.AWS_REGION || "ap-south-1",
                    accessKeyId: process.env.AWS_ACCESS_ID,
                    secretAccessKey: process.env.AWS_SECRET_KEY,
                });
                let csvRows: Array<string> = []

                try {
                    const uploadPromises = extractedFiles.map(async (img) => {
                        const imgPath = fs.existsSync(extractToPath + "/" + folderName) ? path.join(__dirname, assetPath + folderName + "/" + img) : path.join(__dirname, assetPath + img)
                        if (img.includes('.jpg') || img.includes('.jpeg') || img.includes('.png')) {
                            const actualFile = fs.createReadStream(imgPath);
                            return s3.upload({
                                Bucket: process.env.AWS_BUCKET!,
                                Key: (new Date().toDateString().replace(/ /gi, '-')) + "/" + Date.now() + "_jewelryAR_image" + "_" + img,
                                Body: actualFile,
                                ACL: 'public-read',
                                ContentType: 'image/jpeg',
                                ContentDisposition: 'inline'
                            }).promise()
                        }
                    });

                    const imageDetails = await Promise.all(uploadPromises);
                    imageDetails.map((ss3Img) => {
                        if (ss3Img) {
                            let url = ss3Img?.Location
                            const index = url.indexOf("_image_")
                            if (index !== -1) {
                                // getting the image name
                                const textAfterImage = url.substring(index + "_image_".length).replace(/\%20/gi, " ").split(".")?.[0];
                                csvRows.push(`"${textAfterImage}", ${aux.replaceS3LinkWithCloundFront(ss3Img?.Location)}`);
                                //     aux.deleteFile(path.join(__dirname, assetPath + folderName + "/" + textAfterImage));
                                //     aux.deleteFile(path.join(__dirname, "../assets/images/__MACOSX/"  + folderName + "/" + "._" + textAfterImage));
                            }
                        }
                    })

                    fsE.rm(path.join(__dirname, assetPath), { recursive: true, force: true })
                } catch (error) {
                    console.log(error);
                    const { errorName } = aux.getSequelizeError(error);
                    return aux.sendResponse(res, 400, errorName || 'Internal server error (AWS-S3) - 2', null);
                }
                const filename = `${brandName}-images.csv`
                const csvPath = `./${filename}`
                const fileStream = fs.createWriteStream(csvPath, {
                    encoding: "utf-8"
                })
                res.setHeader('Content-disposition', `attachment; filename=${filename}`);
                const csvHeaders = ["variantSku", "variantThumbnail"]
                fileStream.write(csvHeaders.join(",") + "\n", "utf-8")
                fileStream.write(csvRows.join("\n"), "utf-8", () => {
                    fileStream.close()
                    const read = fs.createReadStream(csvPath)
                    read.pipe(res).on("finish", () => {
                        aux.deleteFile(csvPath)
                    })
                })
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }
    getVariantDetails() {
        return async (req: Request | any, res: Response, next: NextFunction) => {
            try {
                const brandDetails = req["brandDetails"];
                const subBrandDetails = req["subBrandDetails"];
                const brandId = brandDetails?.uuid || brandDetails?.brandId;
                const categoryKey = req?.params?.category
                const term = req?.params?.term || ""
                const { pageNo = 1, limit = 10 } = req?.params
                let offset = (pageNo - 1) * limit

                const { status, calibration, qcCalibration }: { status: number, calibration: number, qcCalibration?: number } = req?.body
                let enabledOrDisable = [true, false]
                if (status == 1) enabledOrDisable = [true]
                else if (status == 2) enabledOrDisable = [false]
                let isCalibrated = [true, false]
                if (calibration == 1) isCalibrated = [true]
                else if (calibration == 2) isCalibrated = [false]
                let isQCCalibrated = [true, false]
                if (qcCalibration == 1) isQCCalibrated = [true]
                else if (qcCalibration == 2) isQCCalibrated = [false]

                const termObject: any = {}
                if (term) {
                    termObject[Op.or] = {
                        variantSku: {
                            [Op.iLike]: `%${term}%`
                        },
                        variantTitle: {
                            [Op.like]: `%${term}%`
                        },
                        // got this syntax from stack overflow, official documentation is not found
                        // $<--->$ Replaces the key dynamically
                        // using products instead of product as there is a mapping table which aliases product to products due to m:n relationship
                        "$products.productHandle$": {
                            [Op.like]: `%${term}%`
                        },
                        "$products.productTitle$": {
                            [Op.like]: `%${term}%`
                        }
                    }
                }

                const variantFetchWhereClause: FindOptions = {
                    where: {
                        variantStatus: enabledOrDisable,
                        variantBrandId: brandId,
                        variantIsCalibrated: isCalibrated,
                        // variantIsQCCalibrated: isQCCalibrated,
                        ...(isQCCalibrated.length !== 2 ? { variantIsQCCalibrated: isQCCalibrated } : {}),
                        ...termObject
                    },
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                    },
                    include: [
                        {
                            model: ProductModel,
                            where: {
                                productStatus: [true, false],
                                productBrandId: brandId
                            },
                            required: true,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                            },
                            through: {
                                attributes: []
                            },
                            duplicating: false,
                            include: [
                                {
                                    model: CategoryModel,
                                    where: {
                                        categoryStatus: true,
                                        categoryBrandId: brandId,
                                        categoryKey
                                    },
                                    required: true,
                                    attributes: {
                                        exclude: ['categoryStatus', 'modifiedBy', 'createdAt', 'updatedAt', 'categoryMetaJson']
                                    },
                                }
                            ]
                        }
                    ],
                    limit,
                    offset,
                    // logging: true
                }
                const variantDetails = await ProductQueries.getVariantDetailsBasedOnCategorySequelize(variantFetchWhereClause)
                let count = variantDetails?.count
                let meta = {
                    current_page: pageNo,
                    error_code: '',
                    has_more_pages: count > (pageNo * limit) ? true : false,
                    message: "Success",
                    count
                }
                if (!variantDetails?.rows?.length) return aux.sendResponse(res, 200, "No data found", {
                    data: [],
                    meta
                })
                return aux.sendResponse(res, 200, "Fetched variant details", {
                    data: variantDetails?.rows,
                    meta
                })
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }

    editProductByID() {
        /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
        return async (req: Request, res: Response, next: NextFunction) => {

            const brandDetails = (req as any)['brandDetails']
            console.log("brandDetails: ", brandDetails)
            const subBrandDetails = (req as any)['subBrandDetails']
            const brandId = brandDetails?.uuid || brandDetails?.brandId
            const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId || null

            let responseObj: any = {};

            if (req.body?.product) {
                let productObj = req.body?.product;
                try {
                    const updatedProducts = [];
                    for (const item of productObj) {
                        const { productId, ...updateData } = item;
                        const condition = {
                            productId: productId,
                            productBrandId: brandId,
                            productSubBrandId: subBrandId
                        };
                        const result = await ProductQueries.update(ProductModel, condition, updateData);
                        updatedProducts.push(result);
                    }
                    responseObj.product = updatedProducts;
                } catch (error) {
                    console.log(error);
                    const { errorName } = aux.getSequelizeError(error);
                    return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
                }
            }
            console.log("responseObj: ", responseObj)
            return aux.sendResponse(res, 200, "successfully updated product.", responseObj)
        }
    }

    editVariantByID() {
        /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
        return async (req: Request, res: Response, next: NextFunction) => {

            const brandDetails = (req as any)['brandDetails']
            const brandId = brandDetails.uuid || brandDetails.brandId

            let responseObj: any = {};
            // i have added an all clause
            // the idea is to bulk update all variant of a category
            if (req?.body?.variant && req?.body?.variant?.[0]?.variantId != 'all') {
                let variantObj = req.body.variant;
                console.log("variantObj when ID!=all :", variantObj);
                try {
                    const updatedVariants = [];
                    for (const item of variantObj) {
                        const { variantId, ...updateData } = item;
                        const condition = {
                            variantId: variantId,
                            variantBrandId: brandId,
                        };
                        const result = await ProductQueries.update(VariantModel, condition, updateData);
                        if (result[0] === 0) {
                            return aux.sendResponse(res, 400, "No variants were updated.", null);
                        }
                        updatedVariants.push(result);
                    }
                    responseObj.VariantModel = updatedVariants;
                } catch (error) {
                    console.log(error);
                    const { errorName } = aux.getSequelizeError(error);
                    return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
                }
            } else if (req?.body?.variant?.[0]?.variantId == 'all') {
                const category: string = (req.params?.categories || "")
                if (!category) {
                    return aux.sendResponse(res, 400, "Param categories is mandatory", null)
                }
                let whereClauseForCategory: WhereOptions = {
                    categoryBrandId: brandId,
                    categoryStatus: true,
                    categoryKey: category
                }
                let categories: Model[] = await CategoryQueries.getCategoriesBasedOnWhere(whereClauseForCategory)
                if (!categories.length) {
                    return aux.sendResponse(res, 400, "Specified category is missing in brand", null)
                }
                let categoryId = categories?.[0]?.dataValues?.categoryId
                // bulk process data
                // let updateData = req?.body?.variant?.[0]
                let {filters={}, ...updateData}=req?.body?.variant?.[0];
                const processedFilters = this.processFilters(filters);
                delete updateData.variantId
                const condition = {
                    variantBrandId: brandId,
                    variantCategoryId: categoryId,
                    ...processedFilters
                };
                try {
                    const result = await ProductQueries.update(VariantModel, condition, updateData);
                    responseObj.VariantModel = result;
                } catch (error) {
                    console.log(error);
                    const { errorName } = aux.getSequelizeError(error);
                    return aux.sendResponse(res, 400, errorName || 'Internal server error - 1530', null);
                }
            }
            console.log("responseObj: ", responseObj);
            return aux.sendResponse(res, 200, "Successfully updated variant.", responseObj);
        }
    }

    searchVariantWithVariantSKU() {
        return async (req: Request, res: Response, next: NextFunction) => {
            const brandDetails = (req as any)['brandDetails']
            const subBrandDetails = (req as any)['subBrandDetails']
            const brandId = brandDetails?.uuid || brandDetails?.brandId;
            try {
                const variantSku = req.params.variantSku
                const whereClause: FindOptions = {
                    where: {
                        variantSku: variantSku,
                        variantStatus: true,
                        variantBrandId: brandId,
                        variantIsSetOnly:false
                    },
                    attributes: {
                        exclude: ['variantStatus', 'createdAt', 'updatedAt', 'modifiedBy']
                    },
                    include: [
                        {
                            model: ProductModel,
                            where: {
                                productStatus: true,
                                productBrandId: brandId
                            },
                            attributes: {
                                exclude: ['productStatus', 'createdAt', 'updatedAt', 'modifiedBy']
                            },
                            through: {
                                attributes: []
                            },
                            required: true,
                            include: [
                                {
                                    model: CategoryModel,
                                    where: {
                                        categoryStatus: true,
                                        categoryBrandId: brandId,
                                    },
                                    attributes: {
                                        exclude: ['categoryStatus', 'modifiedBy', 'createdAt', 'updatedAt', 'categoryMetaJson']
                                    },
                                    required: true,
                                }
                            ]
                        }
                    ]
                }
                const response = (await ProductQueries.getVariantDetailsBasedOnCategorySequelize(whereClause))?.rows
                if (response?.length) return aux.sendResponse(res, 200, 'Variant details fetched successfully', response)
                return aux.sendResponse(res, 200, 'No data found', null)
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }

    searchExactInventoriesForVariant() {
        /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const brandDetails = (req as any)['brandDetails'];
                const brandId = brandDetails?.uuid || brandDetails?.brandId;
                const categoryKey = req?.params?.category;
                const variantSku = req?.params?.variantSku;
                const productHandle = req?.params?.productHandle;
                const term = variantSku || productHandle;

                if (!categoryKey) {
                    return aux.sendResponse(res, 400, "category is required for searching", null);
                }
                if (!term) {
                    return aux.sendResponse(res, 400, "VariantSKU or productHandle is required for searching", null);
                }
                let variantDetails = [];
                if (variantSku && variantSku != ':variantSku') {
                    console.log("when we have variantSku");
                    const variantFetchWhereClauseBasedOnVariantSKU: FindOptions = {
                        where: {
                            variantStatus: true,
                            variantBrandId: brandId,
                            variantSku: variantSku
                        },
                        attributes: {
                            exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                        },
                        include: [
                            {
                                model: ProductModel,
                                where: {
                                    productStatus: true,
                                    productBrandId: brandId
                                },
                                required: true,
                                attributes: {
                                    exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                                },
                                through: {
                                    attributes: []
                                },
                            },
                            {
                                model: CategoryModel,
                                where: {
                                    categoryStatus: true,
                                    categoryBrandId: brandId,
                                    categoryKey
                                },
                                attributes: {
                                    exclude: ['modifiedBy', 'createdAt', 'updatedAt', 'categoryMetaJson']
                                },
                            }
                        ],
                    }
                    let tempVariantDetails = await ProductQueries.getVariantDetailsBasedOnCategorySequelize(variantFetchWhereClauseBasedOnVariantSKU);
                    variantDetails.push(tempVariantDetails)
                }
                else if (productHandle && productHandle != ':productHandle') {
                    console.log("when we have productHandle");
                    const variantFetchWhereClauseBasedOnProductHandle: FindOptions = {
                        where: {
                            productStatus: true,
                            productBrandId: brandId,
                            productHandle: productHandle
                        },
                        attributes: {
                            exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                        },
                        include: [
                            {
                                model: CategoryModel,
                                required: true,
                                where: {
                                    categoryStatus: true,
                                    categoryBrandId: brandId,
                                    categoryKey
                                },
                                attributes: {
                                    exclude: ['modifiedBy', 'createdAt', 'updatedAt', 'categoryMetaJson']
                                },
                            },
                            {
                                model: VariantModel,
                                where: {
                                    variantStatus: true,
                                    variantBrandId: brandId,

                                },
                                required: true,
                                attributes: {
                                    exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                                },
                                through: {
                                    attributes: []
                                },
                            },
                        ],
                    }
                    let tempVariantDetails = await ProductQueries.getProductDetailsAndCountSequelize(variantFetchWhereClauseBasedOnProductHandle);
                    variantDetails.push(tempVariantDetails)
                }

                if (!variantDetails.length) {
                    return aux.sendResponse(res, 200, "No variants found matching the search criteria", {
                        data: [],
                    });
                }
                return aux.sendResponse(res, 200, "Fetched variant details", {
                    data: variantDetails
                });
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }

    searchInventoriesForVariant() {
        /**
         * 
         * @param {import("express").Request} req 
         * @param {import("express").Response} res 
         * @param {import("express").NextFunction} next 
         */
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const brandDetails = (req as any)['brandDetails'];
                const brandId = brandDetails?.uuid || brandDetails?.brandId;
                const { pageNo = '1', limit = '10', term, category: categoryKey } = req?.params;
                const {
                    filter_field
                } = req.body
                const {

                } = filter_field
                if (!categoryKey) {
                    return aux.sendResponse(res, 400, "category is required for searching", null);
                }
                if (!term) {
                    return aux.sendResponse(res, 400, "search term is required", null);
                }

                let parsedPageNo = parseInt(pageNo, 10);
                let parsedLimit = parseInt(limit, 10);
                if (isNaN(parsedPageNo)) {
                    parsedPageNo = 1;
                }
                if (isNaN(parsedLimit)) {
                    parsedLimit = 10;
                }
                const offset = (parsedPageNo - 1) * parsedLimit;

                let variantDetails = [];
                const variantFetchWhereClauseBasedOnVariantSKU: FindOptions = {
                    where: {
                        variantStatus: true,
                        variantBrandId: brandId,
                        [Op.or]: [
                            {
                                variantSku: {
                                    [Op.iLike]: `%${term}%`
                                }
                            },
                            {
                                "productHandle": {
                                    [Op.iLike]: `%${term}%`
                                }
                            }

                        ]
                    },
                    include: [
                        {
                            model: ProductModel,
                            where: {
                                productStatus: true,
                                productBrandId: brandId
                            },
                            required: true,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                            },
                            through: {
                                attributes: []
                            },
                        },
                        {
                            model: CategoryModel,
                            where: {
                                categoryStatus: true,
                                categoryBrandId: brandId,
                                categoryKey
                            },
                            attributes: {
                                exclude: ['modifiedBy', 'createdAt', 'updatedAt', 'categoryMetaJson']
                            },
                        }
                    ],
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'modifiedBy']
                    },
                    limit: parsedLimit,
                    offset,
                };
                let tempvariantDetails = await ProductQueries.getVariantDetailsBasedOnCategorySequelize(variantFetchWhereClauseBasedOnVariantSKU);
                variantDetails.push(tempvariantDetails)



                const count = variantDetails?.length;
                const hasMorePages = count > (parsedPageNo * parsedLimit);
                const meta = {
                    current_page: parsedPageNo,
                    error_code: '',
                    has_more_pages: hasMorePages,
                    message: "Success",
                    count
                };

                if (!count) {
                    return aux.sendResponse(res, 200, "No variants found matching the search criteria", {
                        data: [],
                        meta
                    });
                }
                const rows = variantDetails;
                return aux.sendResponse(res, 200, "Fetched variant details", {
                    data: rows,
                    meta
                });
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }

    deleteVariantByID() {
        return async (req: Request, res: Response, next: NextFunction) => {
            const brandDetails = (req as any)['brandDetails'];
            const subBrandDetails = (req as any)['subBrandDetails'];
            const brandId = brandDetails.uuid || brandDetails.brandId;
            const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId;
            console.log("req.body: ", req.body)
            try {
                let result;
                const variantId = req.body.variantId;
                const isAll = Array.isArray(variantId) ? variantId[0] === 'all' : variantId === 'all';
                const processedFilters = this.processFilters(req.body.filters || {});
                if (isAll) {
                    const category: string = (req.params?.categories || "");
                    if (!category) {
                        return aux.sendResponse(res, 400, "Param categories is mandatory for 'all' deletion", null);
                    }
    
                    let whereClauseForCategory: WhereOptions = {
                        categoryBrandId: brandId,
                        categoryStatus: true,
                        categoryKey: category
                    };
                    let categories: Model[] = await CategoryQueries.getCategoriesBasedOnWhere(whereClauseForCategory);
                    if (!categories.length) {
                        return aux.sendResponse(res, 400, "Specified category is missing in brand", null);
                    }
                    let categoryId = categories[0].dataValues.categoryId;
                    const whereClause = {
                        variantBrandId: brandId,
                        variantCategoryId: categoryId,
                        ...processedFilters
                    };
                    const variantsToDelete = await ProductQueries.getVariantDetails(whereClause);
                    if (!variantsToDelete.length) {
                        return aux.sendResponse(res, 404, "No matching variants found to delete", null);
                    }    
                    result = await ProductQueries.deleteData(VariantModel, whereClause);
                } else {
                    result = await ProductQueries.deleteData(VariantModel, { 
                        variantBrandId: brandId, 
                        variantId: variantId 
                    });
                }
                if (result) {
                    return aux.sendResponse(res, 200, "Variant data deleted successfully", null);
                } else if (result === 0) {
                    return aux.sendResponse(res, 404, "No matching variants found to delete", null);
                } else {
                    return aux.sendResponse(res, 400, "Variant data deletion failed", null);
                }
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1892', null);
            }
        }
    }

    deleteProductByID() {
        return async (req: Request, res: Response, next: NextFunction) => {
            const brandDetails = (req as any)['brandDetails']
            const subBrandDetails = (req as any)['subBrandDetails']
            const brandId = brandDetails.uuid || brandDetails.brandId
            const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId
            const productIds = req?.body?.productId
            try {
                let variantIds: Array<number> = []
                const whereClause: FindOptions = {
                    where: {
                        productId: productIds,
                        productBrandId: brandId
                    },
                    include: [
                        {
                            model: VariantModel,
                            where: {
                                variantBrandId: brandId
                            },
                            required: true,
                            through: {
                                attributes: []
                            }
                        },
                    ]
                }
                const response = (await ProductQueries.getProductDetailsAndCountSequelize(whereClause))?.rows
                response.forEach((prod: any) => {
                    const varArr: any = prod?.variants
                    varArr.forEach((variant: any) => {
                        variantIds.push(variant?.variantId)
                    })
                });

                const result = await ProductQueries.deleteData(ProductModel, { productBrandId: brandId, productId: productIds })
                if (!result) return aux.sendResponse(res, 200, "Product data deletion failed", null)
                const variantResult = await ProductQueries.deleteData(VariantModel, { variantBrandId: brandId, variantId: variantIds })
                if (!variantResult) return aux.sendResponse(res, 200, "variant data deletion failed", null)
                return aux.sendResponse(res, 200, "Product data deleted successfully", null)

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    } 

    processFilters = (filters: any) => {
        const processedFilters: any = {};
    
        const processNestedObject = (obj: any, parentKey: string = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = parentKey ? `${parentKey}${key}` : key;
    
                if (fullKey === 'status' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    Object.entries(value).forEach(([statusKey, statusValue]) => {
                        processedFilters[statusKey] = statusValue;
                    });
                } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    processNestedObject(value, `${fullKey}.`);
                } else {
                    switch (typeof value) {
                        case 'string':
                            if (fullKey.toLowerCase().includes('title')) {
                                processedFilters[fullKey] = { [Op.iLike]: `%${value}%` };
                            } else {
                                processedFilters[fullKey] = value;
                            }
                            break;
                        case 'number':
                            processedFilters[fullKey] = value;
                            break;
                        case 'boolean':
                            processedFilters[fullKey] = value;
                            break;
                        case 'object':
                            if (Array.isArray(value)) {
                                if (fullKey.toLowerCase().includes('tags')) {
                                    processedFilters[fullKey] = { [Op.overlap]: value };
                                } else {
                                    processedFilters[fullKey] = { [Op.in]: value };
                                }
                            } else if (value === null) {
                                processedFilters[fullKey] = null;
                            }
                            break;
                        default:
                            throw new Error(`Unsupported type for ${fullKey}`);
                    }
                }
            }
        };
    
        processNestedObject(filters);
        console.log("Processed filters: ", processedFilters);
        return processedFilters;
    };

}
const controller = new ProductController()
export default controller;