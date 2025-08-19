import Joi from "joi";
import logger from "./logger.js";

const postSchema = Joi.object({
    type: Joi.string().valid("text", "photo", "video").required(),
    content: Joi.string().allow("").optional(),
    tags: Joi.array().items(Joi.string()).optional(),
});

const updateSchema = Joi.object({
    content: Joi.string().allow("").optional(),
    tags: Joi.array().items(Joi.string()).optional(),
}).min(1); // Ensure at least one field is provided

export function validatePost(req, res, next) {
    const schema = req.method === "POST" ? postSchema : updateSchema;
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map((e) => e.message).join(", ");
        logger.error(`Validation error: ${errorMessage}`);
        return res.status(400).json({ error: errorMessage });
    }
    next();
}
