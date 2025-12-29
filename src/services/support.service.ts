import { Types } from "mongoose";
import { SupportTicket } from "../models/supportTicket.model.js";
import { SupportMessage } from "../models/supportMessage.model.js";
import { Order } from "../models/order.model.js";
import { AppError } from "../utils/errors.js";
import type { SupportTicketCategory, SupportTicketStatus } from "../types/index.js";

interface LeanTicket {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  ticketNumber: string;
  subject: string;
  category: SupportTicketCategory;
  orderId?: Types.ObjectId;
  status: SupportTicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanMessage {
  _id: Types.ObjectId;
  ticketId: Types.ObjectId;
  sender: "user" | "support";
  senderId: Types.ObjectId;
  message: string;
  createdAt: Date;
}

interface TicketResponse {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  orderId: string | undefined;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TicketWithMessagesResponse extends TicketResponse {
  messages: MessageResponse[];
}

interface MessageResponse {
  id: string;
  sender: string;
  message: string;
  createdAt: Date;
}

interface TicketListResponse {
  tickets: TicketResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateTicketInput {
  subject: string;
  category: SupportTicketCategory;
  orderId: string | undefined;
  message: string;
}

export class SupportService {
  private static mapTicket(ticket: LeanTicket): TicketResponse {
    return {
      id: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      category: ticket.category,
      orderId: ticket.orderId?.toString(),
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  private static mapMessage(message: LeanMessage): MessageResponse {
    return {
      id: message._id.toString(),
      sender: message.sender,
      message: message.message,
      createdAt: message.createdAt,
    };
  }

  static async createTicket(
    userId: string,
    input: CreateTicketInput
  ): Promise<TicketWithMessagesResponse> {
    if (input.orderId) {
      const order = await Order.findOne({
        _id: new Types.ObjectId(input.orderId),
        userId: new Types.ObjectId(userId),
      });
      if (!order) {
        throw AppError.orderNotFound();
      }
    }

    let ticket;
    let retries = 3;

    while (retries > 0) {
      const ticketNumber = await SupportTicket.generateTicketNumber();
      try {
        ticket = await SupportTicket.create({
          userId: new Types.ObjectId(userId),
          ticketNumber,
          subject: input.subject,
          category: input.category,
          orderId: input.orderId ? new Types.ObjectId(input.orderId) : undefined,
          status: "open",
        });
        break;
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          continue;
        }
        throw error;
      }
    }

    if (!ticket) {
      throw AppError.internal("Failed to create support ticket");
    }

    let message;
    try {
      message = await SupportMessage.create({
        ticketId: ticket._id,
        sender: "user",
        senderId: new Types.ObjectId(userId),
        message: input.message,
      });
    } catch (error) {
      await SupportTicket.findByIdAndDelete(ticket._id);
      throw error;
    }

    const ticketResponse = this.mapTicket(ticket.toObject() as LeanTicket);

    return {
      ...ticketResponse,
      messages: [this.mapMessage(message.toObject() as LeanMessage)],
    };
  }

  static async getUserTickets(
    userId: string,
    page: number,
    limit: number,
    status?: SupportTicketStatus
  ): Promise<TicketListResponse> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

    if (status) {
      query["status"] = status;
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanTicket[]>(),
      SupportTicket.countDocuments(query),
    ]);

    return {
      tickets: tickets.map((t) => this.mapTicket(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTicketById(
    userId: string,
    ticketId: string
  ): Promise<TicketWithMessagesResponse> {
    const ticket = await SupportTicket.findOne({
      _id: new Types.ObjectId(ticketId),
      userId: new Types.ObjectId(userId),
    }).lean<LeanTicket>();

    if (!ticket) {
      throw AppError.ticketNotFound();
    }

    const messages = await SupportMessage.find({
      ticketId: new Types.ObjectId(ticketId),
    })
      .sort({ createdAt: 1 })
      .lean<LeanMessage[]>();

    return {
      ...this.mapTicket(ticket),
      messages: messages.map((m) => this.mapMessage(m)),
    };
  }

  static async addMessage(
    userId: string,
    ticketId: string,
    messageText: string
  ): Promise<MessageResponse> {
    const ticket = await SupportTicket.findOneAndUpdate(
      {
        _id: new Types.ObjectId(ticketId),
        userId: new Types.ObjectId(userId),
        status: { $nin: ["closed"] },
      },
      {
        $set: { updatedAt: new Date() },
      },
      { new: true }
    );

    if (!ticket) {
      const existingTicket = await SupportTicket.findOne({
        _id: new Types.ObjectId(ticketId),
        userId: new Types.ObjectId(userId),
      });

      if (!existingTicket) {
        throw AppError.ticketNotFound();
      }

      throw AppError.ticketClosed();
    }

    const message = await SupportMessage.create({
      ticketId: new Types.ObjectId(ticketId),
      sender: "user",
      senderId: new Types.ObjectId(userId),
      message: messageText,
    });

    return this.mapMessage(message.toObject() as LeanMessage);
  }
}
