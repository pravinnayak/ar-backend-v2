import brandQueries from '../DB/queries/BrandQueries'
import brandModel from '../Model/brandModel'
import aux from '../Utility/auxiliary'
import userModel from '../Model/userModel'
import moment from "moment"
import brandSetting from '../Model/brandSettingModel'
import { NextFunction, Request, Response } from "express";


class BrandSettingController {

    insertBrandSetting() {
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                const { settingBrandId, settingLogo = null, settingThemeColor = null, settingMetaJson = null, settingStatus } = req.body
                const object = {
                    settingBrandId,
                    settingLogo,
                    settingThemeColor,
                    settingMetaJson,
                    settingStatus,
                    modifiedBy: process.env.USER_MODIFIED_BY
                }
                const brandSettingUpdateCols = ["settingLogo", "settingThemeColor", "settingMetaJson", "settingStatus"]
                const brandSettingConflictCols = ["settingBrandId"]
                const settingResponse = await brandQueries.upsert(brandSetting, [object], brandSettingUpdateCols, brandSettingConflictCols);

                if (!settingResponse?.length) return aux.sendResponse(res, 400, "Insertion failed", null)
                return aux.sendResponse(res, 201, "Data Inserted successfully.", null)
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }

    updateBrandSetting() {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const settingBrandId = req.body.settingBrandId;
                let updateSettingObj = {
                    settingBrandId,
                    settingStatus: true,
                    ...req.body?.settings,
                    modifiedBy: process.env.USER_MODIFIED_BY
                };
                const upsertResponse = await brandQueries.upsert(
                    brandSetting,
                    [updateSettingObj],
                    Object.keys(updateSettingObj).filter(key => key !== 'settingBrandId'),
                    ['settingBrandId']
                );
                if (upsertResponse?.length) {
                    return aux.sendResponse(res, 200, "Brand setting updated or inserted successfully.", null);
                }
                return aux.sendResponse(res, 400, "Brand setting update or insert failed", null);
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
        }
    }

    getBrandSetting() {
        /**
        * 
        * @param {import("express").Request} req 
        * @param {import("express").Response} res 
        * @param {import("express").NextFunction} next 
        */
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                const settingBrandId = req.params?.brandId;
                const excludeColumns = ['createdAt', 'updatedAt', 'modifiedBy', 'settingId', 'settingStatus']
                const brandSettingDetails = (await brandQueries.getSingleDataByCondition(brandSetting, { settingBrandId, settingStatus: true }, excludeColumns))?.dataValues
                if (brandSettingDetails?.settingBrandId) return aux.sendResponse(res, 200, "brand setting fetched successfully.", brandSettingDetails)
                return aux.sendResponse(res, 400, "brand setting fetch failed", null)
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }

    updateBrandSettingStatus() {
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                const brandDetails = (req as any)['brandDetails']
                const brandId = brandDetails.uuid || brandDetails.brandId
                let flag: (string | Boolean) = req?.params?.enableOrDisable
                if(flag === 'enable') flag = true
                else if (flag === 'disable') flag = false
                else return aux.sendResponse(res, 400, "enableOrDisable should be either enable or disable", null)
                
                const updatedResponse = await brandQueries.update(brandSetting, { settingBrandId: brandId, settingStatus: !flag }, { settingStatus: flag });
                if (updatedResponse?.[0]) return aux.sendResponse(res, 200, "Brand setting status updated successfully", null)
                return aux.sendResponse(res, 400, "Brand setting status updated failed", null)

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }
}


const controller = new BrandSettingController()

export default controller;