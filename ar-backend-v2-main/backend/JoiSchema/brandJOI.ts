import Joi from "joi";

class JOIValidator {
    createBrand() {
        return Joi.object({
            "brandAliasName": Joi.string().required(),
            "brandUsername": Joi.string().required(),
            "brandUserPassword": Joi.string().required(),
            "brandBucketName": Joi.string().allow("", null).optional(),
            "brandMaxProducts": Joi.number().optional(),
            "brandType": Joi.string().allow("", null).optional(),
            "brandContactEmail": Joi.string().required(),
            "brandTermsConditionLink": Joi.string().allow("", null).optional(),
            "brandMetaJson": Joi.any().allow(null, {}).optional(),
            "brandIsSubBrand": Joi.boolean().optional(),
            "brandSubBrandName": Joi.string().allow("", null).optional(),
            "parentBrandId": Joi.string().guid({
                version: ["uuidv1", "uuidv2", "uuidv3", "uuidv4"]
            }).optional(),
            "brandNewMirrarApplicable" : Joi.boolean().optional()
        });
    }

    bulkCreateBrand() {
        return Joi.array().items(this.createBrand());
    }

    bulkUpsetSubBrandMapping() {
        return Joi.object({
            parentBrandId: Joi.string().guid({ version: ["uuidv4"] }).required(),
            subBrandIdDetails: Joi.array().items(Joi.object({
                brandId: Joi.string().guid({ version: ["uuidv4"] }).required(),
                status: Joi.boolean().required()
            })).required()
        });
    }

    updateBrandStatus() {
        return Joi.object({
            brandId: Joi.string().guid({ version: ["uuidv4"] }).required()
        })
    }

    getBrandDetailsById() {
        return Joi.object({
            brandId: Joi.string().guid({ version: ["uuidv4"] }).required()
        })
    }
    authBrand() {
        return Joi.object({
            brandId: Joi.string().guid({ version: ["uuidv4"] }).required(),
        })
    }
}


const joiValidator = new JOIValidator();
export default joiValidator;
