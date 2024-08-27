import Joi from "joi";

class JOIValidator {
    insertBrandSetting() {
        return Joi.object({
            "settingBrandId": Joi.string().guid({
                version: ["uuidv4"]
            }).required(),
            "settingStatus": Joi.boolean().optional(),
            "settingLogo": Joi.string().allow("", null).optional(),
            "settingThemeColor": Joi.string().allow("", null).optional(),
            "settingMetaJson": Joi.object().allow(null, {}).optional(),

        });
    }
    
    updateBrandSetting() {
        return Joi.object({
            "settingBrandId": Joi.string().guid({
                version: ["uuidv4"]
            }).required(),
            "settings": Joi.object().min(1).required().keys({
                "settingLogo": Joi.string().allow("", null).optional(),
                "settingThemeColor": Joi.string().allow("", null).optional(),
                "settingMetaJson": Joi.object().allow(null, {}).optional(),
                "settingStatus": Joi.boolean().optional()
            }).required()
        })
    }
}


const joiValidator = new JOIValidator();
export default joiValidator;
