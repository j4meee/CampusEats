import { Op } from "sequelize";
import { Category, MenuItem, Vendor } from "../model/index.js";

const MAX_WEEKLY_MENU_ITEMS = 10;

const formatManagedMenuItem = (item) => ({
  id: item.id,
  vendorId: item.vendorId,
  name: item.name,
  category: item.category?.name,
  price: Number(item.price),
  stockQuantity: item.stockQuantity,
  prepTimeMinutes: item.prepTimeMinutes,
  tag: item.tag,
  emoji: item.imageLabel,
  description: item.description,
  vendor: item.vendor?.stallName,
  pickupLocation: item.vendor?.pickupLocation,
  isAvailable: item.isAvailable,
});

export const getMenu = async (_req, res) => {
  try {
    const [categories, items] = await Promise.all([
      Category.findAll({ order: [["name", "ASC"]] }),
      MenuItem.findAll({
        where: {
          isAvailable: true,
          stockQuantity: { [Op.gt]: 0 },
        },
        include: [
          { model: Category, as: "category", attributes: ["id", "name"] },
          { model: Vendor, as: "vendor", attributes: ["id", "stallName", "pickupLocation"] },
        ],
        order: [["name", "ASC"]],
      }),
    ]);

    res.status(200).json({
      categories: ["All", ...categories.map((category) => category.name)],
      items: items.map((item) => ({
        id: item.id,
        vendorId: item.vendorId,
        name: item.name,
        category: item.category?.name,
        price: Number(item.price),
        stockQuantity: item.stockQuantity,
        time: `${item.prepTimeMinutes} min`,
        prepTimeMinutes: item.prepTimeMinutes,
        tag: item.tag,
        emoji: item.imageLabel,
        description: item.description,
        vendor: item.vendor?.stallName,
        pickupLocation: item.vendor?.pickupLocation,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu", error: error.message });
  }
};

export const getManageableMenu = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ where: { userId: req.user.id } });

      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      where.vendorId = vendor.id;
    }

    const items = await MenuItem.findAll({
      where,
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: Vendor, as: "vendor", attributes: ["id", "stallName", "pickupLocation"] },
      ],
      order: [
        [{ model: Vendor, as: "vendor" }, "stallName", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      maxSelected: MAX_WEEKLY_MENU_ITEMS,
      items: items.map(formatManagedMenuItem),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch manageable menu", error: error.message });
  }
};

export const updateWeeklyMenu = async (req, res) => {
  try {
    const selectedIds = Array.isArray(req.body.itemIds)
      ? [...new Set(req.body.itemIds.map(Number).filter(Number.isInteger))]
      : null;

    if (!selectedIds) {
      return res.status(400).json({ message: "itemIds must be an array" });
    }

    if (selectedIds.length > MAX_WEEKLY_MENU_ITEMS) {
      return res.status(400).json({ message: `Choose up to ${MAX_WEEKLY_MENU_ITEMS} menu items` });
    }

    const where = {};

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ where: { userId: req.user.id } });

      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      where.vendorId = vendor.id;
    }

    const manageableItems = await MenuItem.findAll({ where, attributes: ["id"] });
    const manageableIds = manageableItems.map((item) => item.id);
    const manageableIdSet = new Set(manageableIds);
    const invalidIds = selectedIds.filter((id) => !manageableIdSet.has(id));

    if (invalidIds.length > 0) {
      return res.status(403).json({ message: "You can only update menu items you manage" });
    }

    await Promise.all([
      MenuItem.update(
        { isAvailable: false },
        { where: { id: manageableIds } },
      ),
      selectedIds.length > 0
        ? MenuItem.update(
            { isAvailable: true },
            { where: { id: selectedIds } },
          )
        : Promise.resolve(),
    ]);

    res.status(200).json({
      message: "Weekly menu updated.",
      selectedCount: selectedIds.length,
      maxSelected: MAX_WEEKLY_MENU_ITEMS,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update weekly menu", error: error.message });
  }
};
