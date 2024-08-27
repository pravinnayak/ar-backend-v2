import Joi from "joi";

class JOIValidator {
    updateCategory() {
        return Joi.object({
            "variantMetaJSON": Joi.object().optional(),
            "variantHeight": Joi.object().optional(),
            "variantXoffset": Joi.object().optional(),
            "variantYoffset": Joi.object().optional(),
            "isQCCalibrated": Joi.boolean().optional() 
        })
            .min(1)
            .required()
            .messages({
                'object.min': 'At least one of variantMetaJSON, variantHeight, variantXoffset, variantYoffset must be present'
            });
    }
    getVariantDetails(){
        return Joi.object({
            "status": Joi.number().optional(),
            "calibration": Joi.number().optional(),
            "qcCalibration": Joi.number().optional()
        })
    }
    deleteVariantDetailsById() {
        return Joi.object({
            variantId: Joi.alternatives().try(
                Joi.array().items(Joi.number()),
                Joi.array().items(Joi.string().valid('all')).max(1),
                Joi.string().valid('all')
            ).required(),
            filters: Joi.object().optional()
        })
    }
    deleteProductDetailsById(){
        return Joi.object({
            "productId": Joi.array().items(Joi.number()).optional()
        })
    }
}

const joiValidator = new JOIValidator();
export default joiValidator;