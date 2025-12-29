import Stripe from "stripe";
import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
} from "@paypal/paypal-server-sdk";
import { Types } from "mongoose";
import { Payment } from "../models/payment.model.js";
import { Order } from "../models/order.model.js";
import { AppError } from "../utils/errors.js";
import { config } from "../config/index.js";
import type { IPayment, PaymentTransactionStatus } from "../types/index.js";
import type {
  CreateStripeIntentInput,
  ConfirmStripePaymentInput,
  CreatePayPalOrderInput,
  CapturePayPalPaymentInput,
} from "../validators/payment.validator.js";

const stripe = new Stripe(config.stripe.secretKey);

const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: config.paypal.clientId,
    oAuthClientSecret: config.paypal.clientSecret,
  },
  environment: config.nodeEnv === "production" ? Environment.Production : Environment.Sandbox,
});

const ordersController = new OrdersController(paypalClient);

interface PaymentResponse {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
  approvalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface WebhookResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  message?: string;
}

export class PaymentService {
  private static mapPayment(payment: IPayment): PaymentResponse {
    const response: PaymentResponse = {
      id: payment._id.toString(),
      orderId: payment.orderId.toString(),
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };

    if (payment.clientSecret) {
      response.clientSecret = payment.clientSecret;
    }

    return response;
  }

  static async createStripeIntent(
    userId: string,
    input: CreateStripeIntentInput
  ): Promise<PaymentResponse> {
    const order = await Order.findOne({
      _id: input.orderId,
      userId,
    });

    if (!order) {
      throw AppError.orderNotFound();
    }

    if (order.paymentStatus === "paid") {
      throw AppError.paymentAlreadyProcessed();
    }

    const existingPayment = await Payment.findOne({
      orderId: order._id,
      provider: "stripe",
      status: { $in: ["pending", "processing"] },
    });

    if (existingPayment && existingPayment.clientSecret) {
      return this.mapPayment(existingPayment);
    }

    const amountInCents = Math.round(order.total * 100);

    if (amountInCents < 50) {
      throw AppError.invalidPaymentAmount();
    }

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: input.currency.toLowerCase(),
        metadata: {
          orderId: order._id.toString(),
          userId: userId,
          orderNumber: order.orderNumber,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Stripe error";
      throw AppError.paymentProviderError(message);
    }

    let payment;
    try {
      payment = await Payment.create({
        orderId: order._id,
        userId: new Types.ObjectId(userId),
        provider: "stripe",
        providerPaymentId: paymentIntent.id,
        amount: order.total,
        currency: input.currency,
        status: "pending",
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const existingPayment = await Payment.findOne({
          orderId: order._id,
          provider: "stripe",
          status: { $in: ["pending", "processing"] },
        });
        if (existingPayment) {
          return this.mapPayment(existingPayment);
        }
      }
      throw error;
    }

    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return this.mapPayment(payment);
  }

  static async confirmStripePayment(
    userId: string,
    input: ConfirmStripePaymentInput
  ): Promise<PaymentResponse> {
    const payment = await Payment.findOne({
      providerPaymentId: input.paymentIntentId,
      userId,
    });

    if (!payment) {
      throw AppError.paymentNotFound();
    }

    if (payment.status === "succeeded") {
      return this.mapPayment(payment);
    }

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Stripe error";
      throw AppError.paymentProviderError(message);
    }

    let newStatus: PaymentTransactionStatus;
    switch (paymentIntent.status) {
      case "succeeded":
        newStatus = "succeeded";
        break;
      case "processing":
        newStatus = "processing";
        break;
      case "canceled":
        newStatus = "cancelled";
        break;
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
        newStatus = "pending";
        break;
      default:
        newStatus = "pending";
    }

    payment.status = newStatus;
    await payment.save();

    if (newStatus === "succeeded") {
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "paid",
        status: "confirmed",
        $push: {
          statusHistory: {
            status: "confirmed",
            timestamp: new Date(),
            note: "Payment confirmed via Stripe",
          },
        },
      });
    }

    return this.mapPayment(payment);
  }

  static async handleStripeWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<WebhookResult> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch {
      throw AppError.webhookSignatureInvalid();
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      if (!paymentIntentId) {
        return { success: true, message: "No payment intent in charge, skipping" };
      }

      const payment = await Payment.findOne({
        providerPaymentId: paymentIntentId,
      });

      if (!payment) {
        return { success: true, message: "Payment not found for refund, skipping" };
      }

      if (charge.refunded && charge.amount_refunded === charge.amount) {
        payment.status = "refunded";
        payment.refundedAmount = charge.amount_refunded / 100;
      } else if (charge.amount_refunded && charge.amount_refunded > 0) {
        payment.status = "partially_refunded";
        payment.refundedAmount = charge.amount_refunded / 100;
      }
      await payment.save();

      if (payment.status === "refunded") {
        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: "refunded",
        });
      }

      return {
        success: true,
        paymentId: payment._id.toString(),
        status: payment.status,
      };
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const payment = await Payment.findOne({
      providerPaymentId: paymentIntent.id,
    });

    if (!payment) {
      return { success: true, message: "Payment not found, skipping" };
    }

    let newStatus: PaymentTransactionStatus;

    switch (event.type) {
      case "payment_intent.succeeded":
        newStatus = "succeeded";
        payment.status = newStatus;
        await payment.save();

        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: "paid",
          status: "confirmed",
          $push: {
            statusHistory: {
              status: "confirmed",
              timestamp: new Date(),
              note: "Payment confirmed via Stripe webhook",
            },
          },
        });
        break;

      case "payment_intent.payment_failed":
        newStatus = "failed";
        payment.status = newStatus;
        if (paymentIntent.last_payment_error?.message) {
          payment.failureReason = paymentIntent.last_payment_error.message;
        }
        await payment.save();
        break;

      case "payment_intent.canceled":
        newStatus = "cancelled";
        payment.status = newStatus;
        await payment.save();
        break;

      default:
        return { success: true, message: `Unhandled event type: ${event.type}` };
    }

    return {
      success: true,
      paymentId: payment._id.toString(),
      status: payment.status,
    };
  }

  static async createPayPalOrder(
    userId: string,
    input: CreatePayPalOrderInput
  ): Promise<PaymentResponse & { approvalUrl: string }> {
    const order = await Order.findOne({
      _id: input.orderId,
      userId,
    });

    if (!order) {
      throw AppError.orderNotFound();
    }

    if (order.paymentStatus === "paid") {
      throw AppError.paymentAlreadyProcessed();
    }

    const existingPayment = await Payment.findOne({
      orderId: order._id,
      provider: "paypal",
      status: { $in: ["pending", "processing"] },
    });

    if (existingPayment && existingPayment.providerOrderId) {
      const response = this.mapPayment(existingPayment);
      return {
        ...response,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${existingPayment.providerOrderId}`,
      };
    }

    let paypalOrder;
    try {
      const response = await ordersController.createOrder({
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              referenceId: order._id.toString(),
              amount: {
                currencyCode: input.currency,
                value: order.total.toFixed(2),
              },
              description: `Order ${order.orderNumber}`,
            },
          ],
          applicationContext: {
            brandName: "French Eyes",
            locale: "de-DE",
            landingPage: OrderApplicationContextLandingPage.Billing,
            userAction: OrderApplicationContextUserAction.PayNow,
            returnUrl: `${config.apiUrl}/api/v1/payments/paypal/return`,
            cancelUrl: `${config.apiUrl}/api/v1/payments/paypal/cancel`,
          },
        },
      });
      paypalOrder = response.result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PayPal error";
      throw AppError.paymentProviderError(message);
    }

    if (!paypalOrder?.id) {
      throw AppError.paymentProviderError("Failed to create PayPal order");
    }

    const approvalLink = paypalOrder.links?.find((link) => link.rel === "approve");
    const approvalUrl = approvalLink?.href || `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrder.id}`;

    let payment;
    try {
      payment = await Payment.create({
        orderId: order._id,
        userId: new Types.ObjectId(userId),
        provider: "paypal",
        providerPaymentId: paypalOrder.id,
        providerOrderId: paypalOrder.id,
        amount: order.total,
        currency: input.currency,
        status: "pending",
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const existingPayment = await Payment.findOne({
          orderId: order._id,
          provider: "paypal",
          status: { $in: ["pending", "processing"] },
        });
        if (existingPayment) {
          const resp = this.mapPayment(existingPayment);
          return {
            ...resp,
            approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${existingPayment.providerOrderId}`,
          };
        }
      }
      throw error;
    }

    const response = this.mapPayment(payment);
    return {
      ...response,
      approvalUrl,
    };
  }

  static async capturePayPalPayment(
    userId: string,
    input: CapturePayPalPaymentInput
  ): Promise<PaymentResponse> {
    const payment = await Payment.findOne({
      providerOrderId: input.paypalOrderId,
      userId,
    });

    if (!payment) {
      throw AppError.paymentNotFound();
    }

    if (payment.status === "succeeded") {
      return this.mapPayment(payment);
    }

    let capturedOrder;
    try {
      const response = await ordersController.captureOrder({
        id: input.paypalOrderId,
        prefer: "return=representation",
      });
      capturedOrder = response.result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PayPal error";
      throw AppError.paymentProviderError(message);
    }

    if (capturedOrder?.status === "COMPLETED") {
      payment.status = "succeeded";
      await payment.save();

      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "paid",
        status: "confirmed",
        $push: {
          statusHistory: {
            status: "confirmed",
            timestamp: new Date(),
            note: "Payment confirmed via PayPal",
          },
        },
      });
    } else {
      payment.status = "failed";
      payment.failureReason = `PayPal order status: ${capturedOrder?.status || "unknown"}`;
      await payment.save();
    }

    return this.mapPayment(payment);
  }

  private static async verifyPayPalWebhook(
    payload: string,
    headers: Record<string, string>
  ): Promise<boolean> {
    const transmissionId = headers["paypal-transmission-id"];
    const transmissionTime = headers["paypal-transmission-time"];
    const certUrl = headers["paypal-cert-url"];
    const transmissionSig = headers["paypal-transmission-sig"];
    const authAlgo = headers["paypal-auth-algo"];

    if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
      return false;
    }

    if (!config.paypal.webhookId) {
      return false;
    }

    try {
      const authString = Buffer.from(
        `${config.paypal.clientId}:${config.paypal.clientSecret}`
      ).toString("base64");

      const baseUrl = config.nodeEnv === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

      const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      const tokenData = await tokenResponse.json() as { access_token: string };
      if (!tokenData.access_token) {
        return false;
      }

      const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: config.paypal.webhookId,
          webhook_event: JSON.parse(payload),
        }),
      });

      const verifyData = await verifyResponse.json() as { verification_status: string };
      return verifyData.verification_status === "SUCCESS";
    } catch {
      return false;
    }
  }

  static async handlePayPalWebhook(
    payload: string,
    headers: Record<string, string>
  ): Promise<WebhookResult> {
    const isValid = await this.verifyPayPalWebhook(payload, headers);
    if (!isValid) {
      throw AppError.webhookSignatureInvalid();
    }

    let event;
    try {
      event = JSON.parse(payload);
    } catch {
      throw AppError.validation("Invalid webhook payload");
    }

    const resource = event.resource;
    if (!resource) {
      return { success: true, message: "No resource in webhook" };
    }

    const paypalOrderId = resource.supplementary_data?.related_ids?.order_id || resource.id;
    if (!paypalOrderId) {
      return { success: true, message: "No PayPal order ID found" };
    }

    const payment = await Payment.findOne({
      providerOrderId: paypalOrderId,
    });

    if (!payment) {
      return { success: true, message: "Payment not found, skipping" };
    }

    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        payment.status = "succeeded";
        await payment.save();

        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: "paid",
          status: "confirmed",
          $push: {
            statusHistory: {
              status: "confirmed",
              timestamp: new Date(),
              note: "Payment confirmed via PayPal webhook",
            },
          },
        });
        break;

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED":
        payment.status = "failed";
        payment.failureReason = event.summary || "Payment denied";
        await payment.save();
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        const refundAmount = parseFloat(resource.amount?.value || "0");
        if (refundAmount >= payment.amount) {
          payment.status = "refunded";
        } else {
          payment.status = "partially_refunded";
        }
        payment.refundedAmount = refundAmount;
        await payment.save();

        if (payment.status === "refunded") {
          await Order.findByIdAndUpdate(payment.orderId, {
            paymentStatus: "refunded",
          });
        }
        break;

      default:
        return { success: true, message: `Unhandled event type: ${event.event_type}` };
    }

    return {
      success: true,
      paymentId: payment._id.toString(),
      status: payment.status,
    };
  }
}
