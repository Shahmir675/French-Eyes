import type { Response, NextFunction } from "express";
import { AdminAuthService } from "../services/admin-auth.service.js";
import { Admin } from "../models/admin.model.js";
import { AppError } from "../utils/errors.js";
import type { AuthenticatedAdminRequest, AdminRole } from "../types/index.js";

export async function authenticateAdmin(
  req: AuthenticatedAdminRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("No token provided");
    }

    const token = authHeader.substring(7);
    const payload = await AdminAuthService.verifyAccessToken(token);

    const admin = await Admin.findById(payload.adminId).select("status role");

    if (!admin) {
      throw AppError.adminNotFound();
    }

    if (admin.status === "inactive") {
      throw AppError.adminInactive();
    }

    req.admin = {
      adminId: payload.adminId,
      email: payload.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: AdminRole[]) {
  return (
    req: AuthenticatedAdminRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.admin) {
      next(AppError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      next(AppError.insufficientPermissions());
      return;
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return async (
    req: AuthenticatedAdminRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.admin) {
        throw AppError.unauthorized();
      }

      if (req.admin.role === "super_admin") {
        next();
        return;
      }

      const admin = await Admin.findById(req.admin.adminId).select("permissions");

      if (!admin) {
        throw AppError.adminNotFound();
      }

      const hasPermission = requiredPermissions.every((perm) =>
        admin.permissions.includes(perm)
      );

      if (!hasPermission) {
        throw AppError.insufficientPermissions();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
