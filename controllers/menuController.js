import { Category, MenuItem, Vendor } from "../model/index.js";

export const getMenu = async (_req, res) => {
  try {
    const [categories, items] = await Promise.all([
      Category.findAll({ order: [["name", "ASC"]] }),
      MenuItem.findAll({
        where: { isAvailable: true },
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
        time: `${item.prepTimeMinutes} min`,
        prepTimeMinutes: item.prepTimeMinutes,
        tag: item.tag,
        emoji: item.imageLabel,
        pickupLocation: item.vendor?.pickupLocation,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu", error: error.message });
  }
};
