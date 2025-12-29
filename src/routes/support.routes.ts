import { Router } from "express";
import { SupportController } from "../controllers/support.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createTicketSchema,
  addMessageSchema,
  ticketIdParamSchema,
  paginationQuerySchema,
} from "../validators/support.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/tickets",
  validate(createTicketSchema, "body"),
  SupportController.createTicket
);

router.get(
  "/tickets",
  validate(paginationQuerySchema, "query"),
  SupportController.getTickets
);

router.get(
  "/tickets/:id",
  validate(ticketIdParamSchema, "params"),
  SupportController.getTicketById
);

router.post(
  "/tickets/:id/messages",
  validate(ticketIdParamSchema, "params"),
  validate(addMessageSchema, "body"),
  SupportController.addMessage
);

export default router;
