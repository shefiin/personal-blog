import { HTTP_STATUS } from "../constants/httpStatus.js";

export const validateRequest = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true
    });
    if(error){
        return next({
            statusCode: HTTP_STATUS.BAD_REQUEST,
            message: error.details[0].message
        });
    }
    req.body = value;
    next();
}
