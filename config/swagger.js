import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "CampusEats API",
    version: "1.0.0",
    description: "REST API documentation for the CampusEats campus food pre-order system.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local backend server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "student@campuseats.test" },
          password: { type: "string", example: "student123" },
          role: { type: "string", example: "student" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Student One" },
          email: { type: "string", example: "student.one@campuseats.test" },
          password: { type: "string", example: "student123" },
          studentId: { type: "string", example: "S001" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Campus Student" },
          email: { type: "string", example: "student@campuseats.test" },
          role: { type: "string", example: "student" },
          vendorStaffType: { type: "string", nullable: true, example: null },
          walletBalance: { type: "number", example: 12.4 },
          status: { type: "string", example: "active" },
        },
      },
      MenuItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Chicken Rice Bowl" },
          description: { type: "string", example: "Steamed rice with chicken, cucumber, and soy garlic sauce." },
          category: { type: "string", example: "Mains" },
          price: { type: "number", example: 3.5 },
          stockQuantity: { type: "integer", example: 30 },
          imageUrl: { type: "string", example: "/images/menu/chicken-rice-bowl.png" },
          vendor: { type: "string", example: "Main Food Counter" },
          vendorServiceStatus: { type: "string", example: "open" },
          pickupLocation: { type: "string", example: "Block A Canteen - Main Food Counter" },
        },
      },
      OrderRequest: {
        type: "object",
        required: ["items", "paymentMethod"],
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["menuItemId", "quantity"],
              properties: {
                menuItemId: { type: "integer", example: 1 },
                quantity: { type: "integer", example: 2 },
              },
            },
          },
          paymentMethod: { type: "string", enum: ["wallet", "qr"], example: "wallet" },
        },
      },
      StatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["preparing", "ready", "picked_up", "cancelled"], example: "preparing" },
          reason: { type: "string", example: "Too busy to prepare in time" },
        },
      },
      VendorSettingsRequest: {
        type: "object",
        required: ["stallName", "pickupLocation", "serviceStatus"],
        properties: {
          stallName: { type: "string", example: "Drinks Counter" },
          pickupLocation: { type: "string", example: "Block A Canteen - Drinks Counter" },
          serviceStatus: { type: "string", enum: ["open", "busy", "very_busy", "closed"], example: "open" },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "You do not have permission to access this resource" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Login, registration, and profile APIs" },
    { name: "Menu", description: "Student menu and vendor menu management" },
    { name: "Orders", description: "Student orders, order status, payment history, and feedback" },
    { name: "Dashboard", description: "Admin and vendor dashboard APIs" },
    { name: "Users", description: "Admin user and vendor management APIs" },
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive a JWT token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a student account",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: { description: "Student account created" },
          400: { description: "Invalid request" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request a password reset hint or response",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", example: "student@campuseats.test" } },
              },
            },
          },
        },
        responses: { 200: { description: "Request handled" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current logged-in user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Missing or invalid token" },
        },
      },
      put: {
        tags: ["Auth"],
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Updated Name" },
                  email: { type: "string", example: "student@campuseats.test" },
                  studentId: { type: "string", example: "S001" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Profile updated" }, 401: { description: "Missing or invalid token" } },
      },
    },
    "/api/auth/change-password": {
      patch: {
        tags: ["Auth"],
        summary: "Change current user's password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", example: "student123" },
                  newPassword: { type: "string", example: "newstudent123" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Password changed" } },
      },
    },
    "/api/menu": {
      get: {
        tags: ["Menu"],
        summary: "List student-visible menu items",
        responses: {
          200: {
            description: "Menu items",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/MenuItem" } },
              },
            },
          },
        },
      },
    },
    "/api/menu/manage": {
      get: {
        tags: ["Menu"],
        summary: "List manageable menu items for admin or vendor",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Manageable menu items" }, 403: { description: "Forbidden" } },
      },
    },
    "/api/menu/weekly": {
      patch: {
        tags: ["Menu"],
        summary: "Select weekly menu item IDs",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["menuItemIds"],
                properties: {
                  menuItemIds: { type: "array", items: { type: "integer" }, example: [1, 2, 3] },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Weekly menu updated" } },
      },
    },
    "/api/menu/{id}/stock": {
      patch: {
        tags: ["Menu"],
        summary: "Update a menu item's stock quantity",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["stockQuantity"],
                properties: { stockQuantity: { type: "integer", example: 25 } },
              },
            },
          },
        },
        responses: { 200: { description: "Stock updated" } },
      },
    },
    "/api/orders": {
      post: {
        tags: ["Orders"],
        summary: "Create an order from cart items",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/OrderRequest" } } },
        },
        responses: { 201: { description: "Order created" }, 400: { description: "Invalid request" } },
      },
    },
    "/api/orders/history": {
      get: {
        tags: ["Orders"],
        summary: "Get current student's order history",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Order history" } },
      },
    },
    "/api/orders/payments": {
      get: {
        tags: ["Orders"],
        summary: "Get current student's payment history",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Payment history" } },
      },
    },
    "/api/orders/notifications": {
      get: {
        tags: ["Orders"],
        summary: "Get current student's notifications",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Notifications" } },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get one order by database ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Order details" }, 404: { description: "Order not found" } },
      },
    },
    "/api/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/StatusUpdateRequest" } } },
        },
        responses: { 200: { description: "Order status updated" }, 403: { description: "Forbidden" } },
      },
    },
    "/api/orders/{id}/feedback": {
      post: {
        tags: ["Orders"],
        summary: "Submit feedback for an order",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: { type: "integer", example: 5 },
                  comment: { type: "string", example: "Fast pickup and good food." },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Feedback submitted" } },
      },
    },
    "/api/dashboard/admin": {
      get: {
        tags: ["Dashboard"],
        summary: "Get admin dashboard data",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Admin dashboard" }, 403: { description: "Forbidden" } },
      },
    },
    "/api/dashboard/vendor/{userId}": {
      get: {
        tags: ["Dashboard"],
        summary: "Get vendor dashboard data for a vendor user",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Vendor dashboard" }, 404: { description: "Vendor profile not found" } },
      },
    },
    "/api/dashboard/vendor/{vendorId}/service-status": {
      patch: {
        tags: ["Dashboard"],
        summary: "Update vendor counter service status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "vendorId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serviceStatus"],
                properties: { serviceStatus: { type: "string", enum: ["open", "busy", "very_busy", "closed"], example: "busy" } },
              },
            },
          },
        },
        responses: { 200: { description: "Service status updated" } },
      },
    },
    "/api/dashboard/vendor/{vendorId}/settings": {
      patch: {
        tags: ["Dashboard"],
        summary: "Update vendor counter settings",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "vendorId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/VendorSettingsRequest" } } },
        },
        responses: { 200: { description: "Vendor settings updated" } },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Users list" }, 403: { description: "Forbidden" } },
      },
      post: {
        tags: ["Users"],
        summary: "Create a user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "New User" },
                  email: { type: "string", example: "new.user@campuseats.test" },
                  password: { type: "string", example: "password123" },
                  role: { type: "string", enum: ["student", "vendor", "admin"], example: "student" },
                  status: { type: "string", enum: ["active", "pending", "disabled"], example: "active" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "User created" } },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "User details" }, 404: { description: "User not found" } },
      },
      put: {
        tags: ["Users"],
        summary: "Update user by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "User updated" } },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 204: { description: "User deleted" } },
      },
    },
    "/api/users/vendors": {
      post: {
        tags: ["Users"],
        summary: "Create a vendor staff account and optionally a new counter",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "vendorStaffType"],
                properties: {
                  name: { type: "string", example: "Drinks Cashier" },
                  email: { type: "string", example: "new.drinks.cashier@campuseats.test" },
                  password: { type: "string", example: "drinks123" },
                  vendorCounterId: { type: "integer", example: 3 },
                  vendorStaffType: { type: "string", enum: ["cashier", "chef"], example: "cashier" },
                  stallName: { type: "string", example: "New Counter" },
                  pickupLocation: { type: "string", example: "Block A Canteen - New Counter" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Vendor user created" } },
      },
    },
    "/api/users/vendors/{id}": {
      delete: {
        tags: ["Users"],
        summary: "Delete or disable a vendor counter",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { 200: { description: "Vendor deleted or disabled" } },
      },
    },
    "/api/users/access-control": {
      get: {
        tags: ["Users"],
        summary: "Get roles and privilege matrix",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Access control data" } },
      },
    },
    "/api/users/students/search": {
      get: {
        tags: ["Users"],
        summary: "Search active students for wallet top-up",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "q", in: "query", schema: { type: "string" }, example: "student" }],
        responses: { 200: { description: "Student search results" } },
      },
    },
    "/api/users/wallet/topup": {
      post: {
        tags: ["Users"],
        summary: "Top up a student wallet",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["studentId", "amount"],
                properties: {
                  studentId: { type: "integer", example: 1 },
                  amount: { type: "number", example: 10 },
                  note: { type: "string", example: "Cash received at counter" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Wallet topped up" } },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});
