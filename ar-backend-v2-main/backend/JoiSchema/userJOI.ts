import Joi from "joi";

class JOIValidator {
    loginForBrand(){
        return Joi.object({
            "brandName": Joi.string().required(),
            "email": Joi.string().required(),
            "password": Joi.string().required(),
        })
    }

    brandAssociatedWithUser(){
        return Joi.object({
            "email": Joi.string().required(),
            "password": Joi.string().required(),
        })
    }
    
    forgetPassword(){
        return Joi.object({
            "email": Joi.string().required(),
            "nextPath": Joi.string().required()
        })
    }

    changePassword(){
        return Joi.object({
            "confirmPassword": Joi.string().required(),
            "newPassword": Joi.string().required(),
            "brandId": Joi.string().required()
        })
    }

    resetPassword(){
        return Joi.object({
            "email": Joi.string().required(),
            "nextPath": Joi.string().required(),
            "uuid": Joi.string().required(),
            "newPassword": Joi.string().required(),
            "confirmPassword": Joi.string().required(),
        })
    }
    removeUserFromBrand() {
        return Joi.object({
            "mappingId": Joi.number().integer().required(),
            "brandId": Joi.string().uuid().required()
        });
    }
    inviteUser(){
        return Joi.object({
            "inviteeEmail": Joi.string().email().required(),
            "inviteeName": Joi.string().required(),
            // "inviteeRole": Joi.string().valid('admin', 'user').default('admin'),
            "inviteeRole": Joi.string().required().trim().disallow('', null),
            "brandId": Joi.string().uuid().required()
        })
    }
    getUsersListUnderBrand() {
        return Joi.object({
            "brandId": Joi.string().uuid().required()
        });
    }
}

const joiValidator = new JOIValidator();
export default joiValidator;
