import Joi from "joi";

class JOIValidator {

    insertCategory() {
        return Joi.object({
            "categoryBrandId": Joi.string().guid({
                version: ["uuidv4"]
            }).required(),
            "categories": Joi.array().items(
                Joi.object({
                    "categoryKey": Joi.string().required(),
                    "categoryLabel": Joi.string().required(),
                    "categorySortOrder": Joi.number().allow(null).optional(),
                    "categorySortBy": Joi.string().allow("",null).optional(),
                    "categoryStatus": Joi.boolean().optional(),
                    "categoryMetaJson": Joi.any().optional(),
                    "categoryIcon": Joi.string().allow("",null).optional(),
                    "categoryType": Joi.string().allow("",null).optional(),
                    "categoryParent": Joi.string().optional(),
                    "categoryIsSet" : Joi.boolean().optional(),
                    "categorySubBrandId": Joi.string().guid({
                        version: ["uuidv4"]
                    }).optional(),
                    "categoryImages" : Joi.array().optional()
                })
            ).required()
        })
    }

    updateCategory(){
        return Joi.object({
            "categoryBrandId": Joi.string().guid({
                version: ["uuidv4"]
            }).required(),
            "categoryKey": Joi.string().required(),
            "categoryLabel": Joi.string().optional(),
            "categoryMetaJson": Joi.any().allow("",null,{}).optional(),
            "categoryIcon": Joi.string().allow("",null).optional(),
            "categorySortOrder": Joi.number().optional(),
            "categorySortBy": Joi.string().allow("",null).optional(),
            "categoryStatus": Joi.boolean().optional(),
            "categoryParent": Joi.string().optional(),
            "categoryIsSet": Joi.boolean().optional(),
            "categoryImages": Joi.array().optional(),
        })
    }

    getCategoryDetails(){
        return Joi.object({
            "brandId": Joi.string().required(),
            "subBrandId": Joi.string().optional(),
            "parent": Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
        })
    }
}

const joiValidator = new JOIValidator();
export default joiValidator;
