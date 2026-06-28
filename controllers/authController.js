import { User, Vendor } from "../model/index.js";

const publicUser = (user) => {
  const { password: _password, ...safeUser } = user.toJSON();
  return safeUser;
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const where = { email };

    const user = await User.findOne({
      where,
      include: [{ model: Vendor, as: "vendorProfile" }],
    });

    if (!user || user.password !== password || user.status !== "active") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (role && user.role !== role && !(role === "staff" && ["admin", "vendor"].includes(user.role))) {
      return res.status(403).json({ message: "This account cannot use that login type" });
    }

    res.status(200).json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
