import Joi from 'joi';

export const paymentValidation = {
  createPayment: Joi.object({
    packageId: Joi.number().integer().required(),
    mobile: Joi.string().pattern(/^09[0-9]{9}$/).optional(),
    email: Joi.string().email().optional()
  }),
  
  webhook: Joi.object({
    authority: Joi.string().required(),
    status: Joi.string().required(),
    ref_id: Joi.string().optional(),
    amount: Joi.number().optional()
  })
};