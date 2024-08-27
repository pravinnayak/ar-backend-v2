import { NextFunction, Response } from 'express';
import brandQueries from '../DB/queries/BrandQueries';
import aux from '../Utility/auxiliary';


async function brandActiveCheck(req:any, res:Response, next:NextFunction) {
    let brandId = req?.query?.brandId || req?.params?.brandId || req?.body?.brandId
    let brandAliasName = req?.query?.brandName || req?.params?.brandName || req?.body?.brandName
    let subBrandId = req?.query?.subBrandId || req?.params?.subBrandId || req?.body?.subBrandId || null
    let functionName:string = ""
    if (brandId && aux.isUUID(brandId)) {
        functionName = "getBrandDetailsByBrandId"
    } else if (brandAliasName) {
        // get brand Details from the alias name
        functionName = "getBrandDetailsByBrandName"
    }
    let response
    try {
        if (functionName === 'getBrandDetailsByBrandId')
            response = (await brandQueries.getBrandDetailsByBrandId({ brandId } ))?.[0]
        else
            response = (await brandQueries.getBrandDetailsByBrandName({ brandName: brandAliasName }))?.[0]
        if (response.length) {
            let brandDetails:any = response?.[0]
            let idFromDB = brandDetails?.brandId;
            req['brandDetails'] = brandDetails
            if (req?.claims?.user?.brandId) {
                let brandIdFromUserAuth = req?.claims?.user?.brandId
                if (brandIdFromUserAuth != idFromDB) {
                    return aux.sendResponse(res, 400, "You do not have permission for this brand,Please contact Admin", null)
                }
            }

            if (subBrandId && aux.isUUID(subBrandId)) {
                const subBrandDetails = (await brandQueries.getBrandDetailsByBrandId(subBrandId))?.[0];
                if (!subBrandDetails.length) return aux.sendResponse(res, 400, 'Sub brand is not active', null);
                req['subBrandDetails'] = subBrandDetails?.[0]
                next?.()
            }
            else next?.()
        }
        else {
            return aux.sendResponse(res, 400, 'Brand Not Active', null)
        }
    } catch (error) {
        console.log(error);
        const { errorName } = aux.getSequelizeError(error)
        return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
    }
}

export { brandActiveCheck };