import aux from '../Utility/auxiliary'
import moment from "moment"
import { NextFunction, Request, Response } from "express";
import sequelize from '../DB/config';
import variant from '../Model/variantModel';
import product from '../Model/productModel';
import userBrandMapping from '../Model/userBrandMappingModel';
import category from '../Model/categoryModel';
import brand from '../Model/brandModel';


class WebhookController {
    constructor() {

    }
    changeBrandId() {
        return async (req: Request, res: Response, next: NextFunction) => {
            let userId = (req as any)?.claims?.user?.userId
            if (!userId) {
                return aux.sendResponse(res, 400, "User is need for change brand", null)
            }
            let oldBrandId = req.body.oldBrandId
            let newBrandId = req.body.newBrandId
            if (!oldBrandId || !newBrandId) {
                return aux.sendResponse(res, 400, "Old and newBrandId needed", null)
            }
            let modifiedBy = userId
            const t = await sequelize.transaction();
            try {

                const brandUpdate = await brand.update({
                    brandId: newBrandId,
                    modifiedBy: modifiedBy
                }, {
                    where: {
                        brandId: oldBrandId
                    },
                    transaction: t
                })
                const varaintUpdate = await variant.update({
                    variantBrandId: newBrandId
                }, {
                    where: {
                        variantBrandId: oldBrandId
                    },
                    transaction: t
                })
                const productUpdate = await product.update({
                    productBrandId: newBrandId
                }, {
                    where: {
                        productBrandId: oldBrandId
                    },
                    transaction: t
                })
                const userMappingUpdate = await userBrandMapping.update({
                    mappingBrandId: newBrandId
                }, {
                    where: {
                        mappingBrandId: oldBrandId
                    },
                    transaction: t
                })
                const categoryUpdate = await category.update({
                    categoryBrandId: newBrandId
                }, {
                    where: {
                        categoryBrandId: oldBrandId
                    },
                    transaction: t
                })
                console.log(brandUpdate, varaintUpdate, productUpdate, userMappingUpdate, categoryUpdate)

                await t.commit()
                return aux.sendResponse(res, 200, `Brand Id has been updated to ${newBrandId}`, null)
            } catch (error) {
                console.log(error)
            }

        }
    }
}
export const webhookController = new WebhookController()