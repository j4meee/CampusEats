import { Vendor } from "../model/index.js";

export const findVendorForUser = async (user, options = {}) => {
  if (!user || user.role !== "vendor") return null;

  if (user.vendorCounterId) {
    return Vendor.findByPk(user.vendorCounterId, options);
  }

  return Vendor.findOne({
    where: { userId: user.id },
    ...options,
  });
};
