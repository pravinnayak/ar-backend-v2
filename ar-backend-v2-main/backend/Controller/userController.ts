import aux from '../Utility/auxiliary'
import userQueries from '../DB/queries/UserQueries'
import brandQueries from '../DB/queries/BrandQueries'
import userBrandMappingModel from '../Model/userBrandMappingModel'
import userModel from '../Model/userModel'
import brandModel from '../Model/brandModel'
import brandSettingModel from '../Model/brandSettingModel'
import { createToken } from '../Utility/token'
import userForgetPasswordModel from '../Model/userForgetPassword'
import userTokenModel from '../Model/userTokenModel'
import { NextFunction, Request, Response } from 'express';

class UserController {
    // signUpUser() {
    //     return async (req:any, res:Response, next:NextFunction) => {
    //         try {
    //             const brandDetails = req["brandDetails"];
    //             const subBrandDetails = req["subBrandDetails"];
    //             const brandId = brandDetails.uuid || brandDetails.brandId;
    //         } catch (error) {

    //         }
    //     }
    // }

    brandAssociatedWithUser() {
        return async (req: Request | any, res: Response | any, next?: NextFunction) => {
            try {
                const { email, password } = req.body;
                const userWhere = {
                    userEmail: email,
                    userStatus: true
                }
                const userExclude = ['createdAt', 'updatedAt'];
                const userDetails = await userQueries.getSingleDataByCondition(userModel, userWhere, userExclude);
                
                if (!userDetails) {
                    return aux.sendResponse(res, 400, "User not found or inactive", null);
                }
                const match = await aux.checkPassword(password, userDetails.userPassword, userDetails.userSalt);
                if (!match) {
                    return aux.sendResponse(res, 400, "Invalid credentials", null);
                }
                const userBrandMapWhere = {
                    mappingUserId: userDetails.userId,
                    mappingStatus: true
                };
                const brandExclude = ['brandUserPassword', 'brandSalt', 'createdAt', 'updatedAt', 'modifiedBy', 'brandLicenseExpiry'];
                const userBrandMappingExclude=['mappingId', 'mappingStatus', 'modifiedBy', 'mappingUserRole', 'mappingBrandId', 'mappingUserId', 'createdAt', 'updatedAt'];
                const brandSettingExclude = ['settingId', 'settingBrandId', 'settingStatus', 'settingThemeColor', 'settingMetaJson', 'modifiedBy', 'createdAt', 'updatedAt'];

                const associatedBrands = await userQueries.getDetailsWMultipleInclude(
                    userBrandMappingModel,
                    [
                        {
                            model: brandModel,
                            where: { brandActiveStatus: true },
                            attributes: { exclude: brandExclude },
                            include: [
                                {
                                    model: brandSettingModel,
                                    attributes: ['settingLogo'],
                                    required: false
                                }
                            ]
                        }
                    ],
                    userBrandMapWhere,
                    userBrandMappingExclude
                );
                const formattedBrands = associatedBrands.map((mapping: { brand: any }) => {
                    const brand = mapping.brand.toJSON();
                    const {brandSetting, ...restBrand}= brand;
                    return {
                        ...restBrand,
                        settingLogo: brandSetting?.settingLogo ?? null,
                    }
                });
                return aux.sendResponse(res, 200, "Login successful", {
                    user: {
                        userId: userDetails.userId,
                        userName: userDetails.userName,
                        userEmail: userDetails.userEmail,
                        userProfileImage: userDetails.userProfileImage
                    },
                    associatedBrands: formattedBrands
                });
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }    

    async loginUser(user:any , role:string = "user") {
        let tokenResponse:any = createToken(user, role);
        
        let upsertObj = {
            userId: user?.userId,
            accessToken: tokenResponse?.accessToken,
            refreshToken: tokenResponse?.refreshToken
        }
        const userTokenUpdateCols = ["accessToken"]
        const userTokenConflictCols = ["userId"]
        let accessToken = await userQueries.upsert(userTokenModel, [upsertObj], userTokenUpdateCols, userTokenConflictCols)
        delete tokenResponse.refreshToken;
        return { ...tokenResponse, refreshToken: accessToken?.[0]?.dataValues?.refreshToken };
    }

    loginForBrand() {
        return async (req:any, res:Response, next:NextFunction) => {
            try {
                const brandDetails = req["brandDetails"];
                const subBrandDetails = req["subBrandDetails"];
                const brandId = brandDetails?.uuid || brandDetails?.brandId;
                const { brandName, email, password } = req?.body

                let userBrandMapWhere = {
                    mappingBrandId: brandId,
                    mappingStatus: true
                }
                let userWhere = {
                    userEmail: email,
                    userStatus: true
                }

                const userExclude = ['userId', 'userPassword', 'userStatus', 'userSalt', 'createdAt', 'updatedAt']
                const mappingResponse = await userQueries.getDetailsWInclude(userBrandMappingModel, userModel, userBrandMapWhere, userWhere)

                if (!mappingResponse.length)
                    return aux.sendResponse(res, 400, "Please contact admin, as you are not invited to this brand", null);
                let { user: userDetails } = mappingResponse[0]?.dataValues
                userDetails = userDetails?.dataValues

                const { userId, userPassword, userSalt } = userDetails;
                let match = await aux.checkPassword(
                    password,
                    userPassword,
                    userSalt
                );
                if (!match)
                    return aux.sendResponse(res, 400, "Credentials mismatch.", null);

                let role = mappingResponse[0]?.mappingUserRole;
                let mappingBrandId = mappingResponse[0]?.mappingBrandId;
                userDetails["brandId"] = mappingBrandId;
                delete userDetails?.userStatus
                delete userDetails?.userSalt
                delete userDetails?.userPassword
                delete userDetails?.userPhone
                delete userDetails?.createdAt
                delete userDetails?.updatedAt
                let token = await this.loginUser(userDetails, role);
                delete userDetails?.userId

                return aux.sendResponse(res, 200, 'Logged In Successfully', {
                    brandDetails,
                    user: userDetails,
                    token
                })

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }

    forgotPassword() {
        return async (req:Request, res:Response, next:NextFunction) => {
            try {
                let unusedValidLink = false;
                let updatedFrgtPasswordData;
                let userDetails;
                const {
                    email,
                    nextPath = "",
                } = req.body;

                let condition = {
                    userEmail: email,
                    status: true
                }
                const forgotPasswordDetails = (await userQueries.getDetailsWInclude(userForgetPasswordModel, userModel, condition, { userEmail: email, userStatus: true }))?.[0]?.dataValues
                if (forgotPasswordDetails?.id) {
                    unusedValidLink = true
                    updatedFrgtPasswordData = (await userQueries.update(userForgetPasswordModel, { id: forgotPasswordDetails?.id }, { status: false }))?.[1]?.[0]?.dataValues

                    if (updatedFrgtPasswordData?.status === true) return aux.sendResponse(res, 400, 'Internal server error - 1', null)
                }
                if (!unusedValidLink) {
                    try {
                        userDetails = (await userQueries.getSingleDataByCondition(userModel, { userEmail: email, userStatus: true }))?.dataValues

                        if (!userDetails?.userId)
                            return aux.sendResponse(res, 404, "Internal server error - 1.1");
                    } catch (error) {
                        console.log(error);
                        const { errorName } = aux.getSequelizeError(error)
                        return aux.sendResponse(res, 400, errorName || 'Internal server error - 1.2', null)
                    }
                }
                try {
                    const ip:any = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || null
                    const locationDetails:any = await aux.getLocationByIP(ip);
                    console.log(
                        ip,
                        locationDetails?.data?.city,
                        999.99
                    );
                    let expiryPeriod = 24
                    let currentDate = new Date();
                    currentDate.setHours(currentDate.getHours() + expiryPeriod);

                    const addedData = (await userQueries.createData(userForgetPasswordModel, {
                        userEmail: email,
                        userId: userDetails?.userId || forgotPasswordDetails?.userId,
                        frontEndRedirectPath: nextPath,
                        ipAddress: ip,
                        location: locationDetails?.data?.city || null,
                        expiryAt: currentDate
                    }))?.dataValues

                    if (!addedData?.id)
                        return aux.sendResponse(
                            res,
                            400,
                            "Failed to upsert forgot password details",
                            null
                        );
                    const emailSent = await aux.sendEmail(
                        { email: "mirrar@styledotme.com", name: "MirrAR" },
                        [
                            {
                                name: userDetails?.userName || updatedFrgtPasswordData?.user?.userName,
                                email: userDetails?.userEmail || updatedFrgtPasswordData?.userEmail,
                            },
                        ],
                        "Reset Password link",
                        await aux.emailHTMLTemplateGeneratorFunc(
                            {
                                userName: userDetails?.userName || updatedFrgtPasswordData?.user?.userName,
                                redirectLink: `${nextPath}?uuid=${addedData?.id}`,
                                ip,
                                location: locationDetails?.data?.city || "",
                                expiryPeriod
                            },
                            "resetPassword"
                        )
                    );

                    if (!emailSent?.messageId)
                        return aux.sendResponse(res, 400, "Failed to send mail.", null);

                    return aux.sendResponse(res, 200, "Mail sent successfully", null);
                } catch (error) {
                    console.log(error);
                    const { errorName } = aux.getSequelizeError(error)
                    return aux.sendResponse(res, 400, errorName || 'Internal server error - 2', null)
                }
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 6', null)
            }
        }
    }

    resetPassword() {
        return async (req:Request, res:Response, next:NextFunction) => {
            const { uuid, email, newPassword, confirmPassword, nextPath } = req.body;
            let updatedUserDetails;
            let resetPswdData;
            let hashedPassword;
            let salt;
            try {
                resetPswdData = await userQueries.getDetailsWInclude(userForgetPasswordModel, userModel, { id: uuid, status: true }, { userStatus: true })

                if (resetPswdData?.length === 0)
                    return aux.sendResponse(
                        res,
                        400,
                        "This link is expired. Please reset your password again or contact support."
                    );
                if (resetPswdData?.[0]?.userEmail != email) {
                    return aux.sendResponse(
                        res,
                        400,
                        "Forgot password request has not been raised for the entered email. Please provide correct email address."
                    );
                }

                if (new Date() > new Date(resetPswdData?.[0]?.expiryAt))
                    return aux.sendResponse(
                        res,
                        400,
                        "Reset password is expired. Please get new link to reset your password."
                    );
                resetPswdData = resetPswdData[0]?.dataValues;
                if (newPassword !== confirmPassword)
                    return aux.sendResponse(
                        res,
                        400,
                        "new password and confirm password doesn't match",
                        null
                    );
                // If previous password and current password is same , don't let the user to reset.
                const isPasswordSame = await aux.checkPassword(
                    confirmPassword,
                    resetPswdData?.user?.userPassword,
                    resetPswdData?.user?.userSalt
                );

                if (isPasswordSame)
                    return aux.sendResponse(
                        res,
                        400,
                        "Your previous and current password can not be same."
                    );
                [hashedPassword, salt] = await aux.encryptPassword(confirmPassword);

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
            try {
                updatedUserDetails = (await userQueries.update(userModel, { userId: resetPswdData?.userId, }, { userPassword: hashedPassword, userSalt: salt }))?.[1]?.[0]

                if (!updatedUserDetails?.userId)
                    return aux.sendResponse(res, 400, "Password updation failed");
                // set user forget password link status to false
                const updatedForgotPswdData = (await userQueries.update(userForgetPasswordModel, { id: resetPswdData?.id, status: true }, { status: false }))?.[1]?.[0];

                if (updatedForgotPswdData?.status === true || !updatedForgotPswdData?.id)
                    return aux.sendResponse(res, 400, "Internal server error - 2");

                const ip:any = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || null
                const locationDetails:any = await aux.getLocationByIP(ip);
                console.log(
                    ip,
                    locationDetails?.data?.city,
                    999.99
                );
                const emailSent = await aux.sendEmail(
                    { email: "mirrar@styledotme.com", name: "MirrAR" },
                    [
                        {
                            name: resetPswdData?.user?.userName,
                            email: resetPswdData?.userEmail,
                        },
                    ],
                    "Password updated successfully",
                    await aux.emailHTMLTemplateGeneratorFunc(
                        {
                            userName: resetPswdData?.user?.userName,
                            redirectLink: nextPath,
                            ip,
                            location: locationDetails?.data?.city || "",
                        },
                        "resetPasswordSuccessful"
                    )
                );

                if (!emailSent?.messageId)
                    return aux.sendResponse(
                        res,
                        400,
                        "Password reset was successful, But failed to send mail",
                        null
                    );

                return aux.sendResponse(
                    res,
                    200,
                    "The password reset was successful, and the email has been sent successfully"
                );
            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1.1', null)
            }
        };
    }

    changePassword() {
        return async (req:any, res:Response, next:NextFunction) => {
            try {
                const brandDetails = req["brandDetails"];
                const subBrandDetails = req["subBrandDetails"];
                const brandId = brandDetails?.uuid || brandDetails?.brandId;
                const userId = req?.claims?.user?.userId;
                console.log("🚀 ~ UserController ~ return ~ userId:", userId, 999)
                const { newPassword, confirmPassword } = req.body;
                if(newPassword != confirmPassword){
                    return aux.sendResponse(res, 400, "Confirm password not same as new password", null);
                }
                if(!userId){
                    return aux.sendResponse(res, 400, "Not a valid user,Please check if you are logged in", null);
                }
                const mappingCondition = {
                    mappingStatus: true,
                    mappingBrandId: brandId,
                    mappingUserId: userId
                }
                const userCondition = {
                    userId,
                    userStatus: true
                }
                const userDetails = (await userQueries.getDetailsWInclude(userBrandMappingModel, userModel, mappingCondition, userCondition))?.[0]?.dataValues

                if (userDetails?.user?.userId) {
                    const { userId, userPassword, userSalt, userEmail, userName } = userDetails?.user;
                    // const match = await aux.checkPassword(currentPassword, userPassword, userSalt);
                    // if (!match) return aux.sendResponse(res, 400, "Incorrect current password", null);

                    const samePassword = await aux.checkPassword(newPassword, userPassword, userSalt);
                    if (samePassword) return aux.sendResponse(res, 400, "Current password cannot be same as previous password.", null);

                    const [hashedPassword, salt] = await aux.encryptPassword(newPassword);
                    const updatedUserDetails = (await userQueries.update(userModel, { userId, userStatus: true }, { userPassword: hashedPassword, userSalt: salt }))?.[1]?.[0];
                    if (!updatedUserDetails?.userId) return aux.sendResponse(res, 400, "Password updation failed");
                    const emailSent = await aux.sendEmail(
                        { email: "mirrar@styledotme.com", name: "MirrAR" },
                        [
                            {
                                email: userEmail,
                                name: userName,
                            },
                        ],
                        "You changed your password successfully.",
                        await aux.emailHTMLTemplateGeneratorFunc(
                            {
                                userName: userDetails.user?.userName,
                            },
                            "changePassword"
                        )
                    );
                    if (!emailSent?.messageId)
                        return aux.sendResponse(res, 200, "Password changed successfully, Failed to send mail.", null);
                    return aux.sendResponse(res, 200, "Password changed successfully, Email sent");
                }
                return aux.sendResponse(res, 401, "User not found", null);

            } catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error)
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null)
            }
        }
    }

    removeUserFromBrand(){
        /**
         * 
         * @param {import("express").Request} req 
         * @param {import("express").Response} res 
         * @param {import("express").NextFunction} next 
     */
        return async (req:Request|any, res:Response|any, next:NextFunction)=>{
            const { mappingId } = req.body;
            try{
                const brandDetails = req["brandDetails"];
                const subBrandDetails = req["subBrandDetails"];
                const brandId = brandDetails?.uuid || brandDetails?.brandId;
                const mappingBrandId=brandId
                
                const userBrandMapping = await userQueries.getSingleDataByCondition(userBrandMappingModel, {
                    mappingId,
                    mappingBrandId,
                    mappingStatus: true
                });

                if (!userBrandMapping) {
                    return aux.sendResponse(res, 404, "User is not associated with the brand", null);
                }

                const updatedMapping = await userQueries.update(userBrandMappingModel, {
                    mappingId,
                    mappingBrandId
                }, {
                    mappingStatus: false
                });

                if (!updatedMapping[1].length) {
                    return aux.sendResponse(res, 400, "Failed to remove user from the brand", null);
                }

                return aux.sendResponse(res, 200, "User removed successfully from the brand", null);
            }catch(error){
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - ', null);
            }
        }
    }

    inviteUser(){
         /**
          * 
          * @param {import("express").Request} req 
          * @param {import("express").Response} res 
          * @param {import("express").NextFunction} next 
      */
         return async (req: Request, res: Response, next: NextFunction) => {
            try{
                const brandDetails = (req as any)['brandDetails']
                const subBrandDetails = (req as any)['subBrandDetails']
                const brandId = brandDetails.uuid || brandDetails.brandId
                const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId
                const currentUser= aux.getSignedInUser(req)
                let role=req.body?.inviteeRole || "admin"
                let password: string | null =null
                //curr user has permission to invite ?
                const userBrandMapping=await userQueries.getSingleDataByCondition(userBrandMappingModel,{
                    mappingUserId: currentUser,
                    mappingBrandId: brandId,
                    mappingStatus: true
                })
                if (!userBrandMapping) {
                    return aux.sendResponse(res, 403, "You do not have permission to invite users", null);
                }
                const { inviteeEmail, inviteeName } = req.body;
                // Check if the user already exists
                let userDetails = await userQueries.getSingleDataByCondition(userModel, { userEmail: inviteeEmail });
                if (!userDetails) {
                    // Create new user
                    password = aux.generateRandomPassword(10);
                    const [hashedPassword, salt] = await aux.encryptPassword(password);
                    userDetails = await userQueries.createData(userModel, {
                        userEmail: inviteeEmail,
                        userName: inviteeName,
                        userPassword: hashedPassword,
                        userSalt: salt,
                        userStatus: true
                    });
                }
                if (userDetails?.userId) {
                    // Check if the user is already invited to this brand
                    const existingMapping = await userQueries.getSingleDataByCondition(userBrandMappingModel, {
                        mappingUserId: userDetails.userId,
                        mappingBrandId: brandId,
                        mappingStatus: true
                    });
                    if (existingMapping) {
                        return aux.sendResponse(res, 400, "User is already invited to this brand", null);
                    }
                    // Add or update user-brand mapping
                    const mappingData = {
                        mappingUserId: userDetails.userId,
                        mappingBrandId: brandId,
                        mappingStatus: true,
                        mappingUserRole: role,
                        modifiedBy: currentUser
                    };
                    await userQueries.upsert(userBrandMappingModel, [mappingData], ["mappingStatus", "mappingUserRole", "modifiedBy"], ["mappingUserId", "mappingBrandId"]);
                    // Send invitation email
                    let redirectLink;
                    if (!req.headers.origin) {
                        console.log("Request origin is missing, falling back to default URL");
                        redirectLink = "https://new-mirrar-dashboard.netlify.app/authentication/sign-in";
                    } else {
                        redirectLink = `${req.headers.origin}/authentication/sign-in`;
                    }
                    const emailSent = await aux.sendEmail(
                        { email: "mirrar@styledotme.com", name: "MirrAR" },
                        [{ email: inviteeEmail, name: inviteeName }],
                        `You are invited ${!password ? '- Reminder' : ''}`,
                        await aux.emailHTMLTemplateGeneratorFunc(
                            {
                                userName: inviteeName,
                                userEmailID: inviteeEmail,
                                brandName: brandDetails.brandAliasName,
                                password: !password ? "Use the existing credentials to login." : password,
                                redirectLink
                            },
                            "inviteUser"
                        )
                    );

                    if (!emailSent?.messageId) {
                        return aux.sendResponse(res, 400, "Failed to send invitation email", null);
                    }

                    let message = "User invited";
                    if (password) message += " and new password is generated";
                    else message += " again";

                    return aux.sendResponse(res, 200, message, password ? { password } : null);
                }else {
                    return aux.sendResponse(res, 400, "Could not add user. Something went wrong, try again later", null);
                }

            }catch (error) {
                console.log(error);
                const { errorName } = aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - 1', null);
            }
         }
    }

    getUsersListUnderBrand(){
        /**
         * 
         * @param {import("express").Request} req 
         * @param {import("express").Response} res 
         * @param {import("express").NextFunction} next 
     */
        return async(req:Request|any , res:Response|any, next?:NextFunction)=>{
            try{
                const brandDetails = (req as any)['brandDetails']
                const subBrandDetails = (req as any)['subBrandDetails']
                const brandId = brandDetails.uuid || brandDetails.brandId
                const subBrandId = subBrandDetails?.uuid || subBrandDetails?.brandId

                const userBrandMapWhere={
                    mappingBrandId:brandId,
                    mappingStatus:true
                }
                const userWhere={
                    userStatus:true
                }
                const userExclude = ['userStatus', 'userPhone', 'userPassword', 'userSalt', 'createdAt', 'updatedAt'];
                const userBrandMappingExclude = ['mappingStatus', 'modifiedBy', 'mappingUserRole', 'mappingBrandId', 'mappingUserId', 'createdAt', 'updatedAt'];

                const users=await userQueries.getDetailsWMultipleInclude(
                    userBrandMappingModel,
                    [
                        {
                            model:userModel,
                            where:userWhere,
                            attributes: { exclude: userExclude }
                        }
                    ],
                    userBrandMapWhere,
                    userBrandMappingExclude
                )
                return aux.sendResponse(res, 200, "Users fetched successfully", users);
            }catch(error){
                console.log(error);
                const {errorName}=aux.getSequelizeError(error);
                return aux.sendResponse(res, 400, errorName || 'Internal server error - ', null)
            }
        }
    }

}


const controller = new UserController();
export default controller;