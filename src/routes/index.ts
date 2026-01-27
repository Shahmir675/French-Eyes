import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import cartRoutes from "./cart.routes.js";
import orderRoutes from "./order.routes.js";
import zoneRoutes from "./zone.routes.js";
import paymentRoutes from "./payment.routes.js";
import loyaltyRoutes from "./loyalty.routes.js";
import bonusRoutes from "./bonus.routes.js";
import supportRoutes from "./support.routes.js";
import driverRoutes from "./driver.routes.js";
import adminRoutes from "./admin.routes.js";
import deviceRoutes from "./device.routes.js";
import restaurantRoutes from "./restaurant.routes.js";
import notificationRoutes from "./notification.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/zones", zoneRoutes);
router.use("/payments", paymentRoutes);
router.use("/loyalty", loyaltyRoutes);
router.use("/bonuses", bonusRoutes);
router.use("/support", supportRoutes);
router.use("/driver", driverRoutes);
router.use("/admin", adminRoutes);
router.use("/devices", deviceRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/notifications", notificationRoutes);

export default router;
