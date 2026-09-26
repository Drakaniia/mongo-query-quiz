import type { Problem } from "../types.js";
import { rx } from "../values.js";
import { CUSTOMERS, EMPLOYEES, INVOICES, ORDERS, PRODUCTS, REVIEWS, SESSIONS, TICKETS } from "./datasets.js";

export const difficultProblems: Problem[] = [
  {
    id: "difficult-nested-paths",
    title: "Big orders to Berlin",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Logistics needs the large orders heading to Berlin, Germany. Reach into the nested shipping document with dot notation and keep only orders whose total is greater than 100.",
    clues: ["the large orders heading to Berlin, Germany", "whose total is greater than 100"],
    sql: "SELECT * FROM orders WHERE shipping.city = 'Berlin' AND shipping.country = 'Germany' AND total > 100;",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "Reach into a nested document with a quoted dotted path: `\"shipping.city\"`.",
      "Add a comparison on `total` with `$gt`.",
      "All three conditions combine with an implicit AND.",
    ],
    referenceAnswer:
      'db.orders.find({ "shipping.city": "Berlin", "shipping.country": "Germany", total: { $gt: 100 } })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "orders" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { "shipping.city": "Berlin", "shipping.country": "Germany", total: { $gt: 100 } },
        },
      },
    ],
  },
  {
    id: "difficult-elemmatch",
    title: "Bulk keyboard reorder",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Purchasing wants orders that contain at least one line item named \"Keyboard\" with a quantity of 2 or more, so they can bulk reorder that unit.",
    clues: ["contain at least one line item named \"Keyboard\" with a quantity of 2 or more"],
    sql: "SELECT * FROM orders WHERE EXISTS (SELECT 1 FROM items WHERE name = 'Keyboard' AND qty >= 2);",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "Match one array element that satisfies several conditions with `$elemMatch`.",
      "The element must have `name: \"Keyboard\"` and `qty >= 2`.",
      "`$elemMatch` takes a single document of conditions.",
    ],
    referenceAnswer:
      'db.orders.find({ items: { $elemMatch: { name: "Keyboard", qty: { $gte: 2 } } } })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "orders" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { items: { $elemMatch: { name: "Keyboard", qty: { $gte: 2 } } } },
        },
      },
    ],
  },
  {
    id: "difficult-or-comparison",
    title: "Cheap or heavily stocked",
    difficulty: "difficult",
    operation: "find",
    statement:
      "A restock alert flags products that are either very cheap (under 10) or sitting on more than 100 units. Return every flagged product.",
    clues: ["either very cheap (under 10) or sitting on more than 100 units"],
    sql: "SELECT * FROM products WHERE price < 10 OR stock > 100;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Use `$or` with an array of two clause documents.",
      "The first clause compares `price` with `$lt`.",
      "The second clause compares `stock` with `$gt`.",
    ],
    referenceAnswer: "db.products.find({ $or: [{ price: { $lt: 10 } }, { stock: { $gt: 100 } }] })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { $or: [{ price: { $lt: 10 } }, { stock: { $gt: 100 } }] } },
      },
    ],
  },
  {
    id: "difficult-pull-addtoset",
    title: "Clean up and promote tags",
    difficulty: "difficult",
    operation: "update",
    statement:
      "For the customer with email \"dana@example.com\", retire the \"legacy\" tag and add \"vip\" without creating a duplicate if it is already present.",
    clues: [
      "the customer with email \"dana@example.com\"",
      "retire the \"legacy\" tag and add \"vip\" without creating a duplicate if it is already present",
    ],
    sql: "UPDATE customers SET tags = array_remove(tags, 'legacy'), tags = array_append(tags, 'vip') WHERE email = 'dana@example.com';",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "`$pull` removes matching values from an array.",
      "`$addToSet` adds a value only if it is not already present.",
      "Both operators can be combined in one update document.",
    ],
    referenceAnswer:
      'db.customers.updateOne({ email: "dana@example.com" }, { $pull: { tags: "legacy" }, $addToSet: { tags: "vip" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "customers" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { email: "dana@example.com" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $pull: { tags: "legacy" }, $addToSet: { tags: "vip" } } },
      },
    ],
  },
  {
    id: "difficult-update-many-options",
    title: "Archive pending orders",
    difficulty: "difficult",
    operation: "update",
    statement:
      "Nightly maintenance archives every pending order: set status to \"archived\" and bump its version by one, creating the order if none matches (upsert).",
    clues: [
      "every pending order",
      "set status to \"archived\" and bump its version by one",
      "creating the order if none matches",
    ],
    sql: "UPDATE orders SET status = 'archived', version = version + 1 WHERE status = 'pending';",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "Use `updateMany` with three arguments: filter, update, options.",
      "Combine `$set` and `$inc` in the update document.",
      "Pass `{ upsert: true }` as the options argument.",
    ],
    referenceAnswer:
      'db.orders.updateMany({ status: "pending" }, { $set: { status: "archived" }, $inc: { version: 1 } }, { upsert: true })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "orders" },
      },
      {
        id: "method",
        label: "Method",
        weight: 15,
        expectation: { kind: "method", method: "updateMany" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 25,
        expectation: { kind: "filter", doc: { status: "pending" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 35,
        expectation: { kind: "update", doc: { $set: { status: "archived" }, $inc: { version: 1 } } },
      },
      {
        id: "options",
        label: "Options",
        weight: 15,
        expectation: { kind: "options", doc: { upsert: true } },
      },
    ],
  },
  {
    id: "difficult-all-tags",
    title: "Sale and new",
    difficulty: "difficult",
    operation: "find",
    statement:
      "A campaign highlights products carrying both the \"sale\" and \"new\" tags at the same time. Return those products.",
    clues: ["carrying both the \"sale\" and \"new\" tags at the same time"],
    sql: "SELECT * FROM products WHERE tags CONTAINS ALL ('sale', 'new');",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "To require every value in an array, use `$all`.",
      "`$all` takes an array of the required values.",
      "`{ tags: { $all: [\"sale\", \"new\"] } }`.",
    ],
    referenceAnswer: 'db.products.find({ tags: { $all: ["sale", "new"] } })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { tags: { $all: ["sale", "new"] } } },
      },
    ],
  },
  {
    id: "difficult-size",
    title: "Orders with three lines",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Fraud review looks at orders whose items array holds exactly three line items. Return those orders.",
    clues: ["orders whose items array holds exactly three line items"],
    sql: "SELECT * FROM orders WHERE array_length(items) = 3;",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "`$size` matches an array with an exact number of elements.",
      "The operand is the required length, not an array.",
      "`{ items: { $size: 3 } }`.",
    ],
    referenceAnswer: "db.orders.find({ items: { $size: 3 } })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "orders" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { items: { $size: 3 } } },
      },
    ],
  },
  {
    id: "difficult-nor",
    title: "Neither books nor nearly free",
    difficulty: "difficult",
    operation: "find",
    statement:
      "An audit excludes products that are in the books category or priced under 5. Return everything that matches neither condition.",
    clues: ["in the books category or priced under 5", "matches neither condition"],
    sql: "SELECT * FROM products WHERE NOT (category = 'books' OR price < 5);",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Negate a list of alternatives with `$nor`.",
      "`$nor` takes an array of clauses, like `$or`.",
      "`{ $nor: [{ category: \"books\" }, { price: { $lt: 5 } }] }`.",
    ],
    referenceAnswer: 'db.products.find({ $nor: [{ category: "books" }, { price: { $lt: 5 } }] })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { $nor: [{ category: "books" }, { price: { $lt: 5 } }] },
          variants: [{ $not: { $or: [{ category: "books" }, { price: { $lt: 5 } }] } }],
        },
      },
    ],
  },
  {
    id: "difficult-regex-name-projection",
    title: "Desk range",
    difficulty: "difficult",
    operation: "find",
    statement:
      "The home landing page lists home-category products whose name starts with \"Desk\". Return only their name and price.",
    clues: ["home-category products whose name starts with \"Desk\"", "only their name and price"],
    sql: "SELECT name, price FROM products WHERE name LIKE 'Desk%' AND category = 'home';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Anchor the pattern at the start with `^`.",
      "Combine the name regex with an equality on `category`.",
      "Project `{ name: 1, price: 1 }`.",
    ],
    referenceAnswer:
      'db.products.find({ name: /^Desk/, category: "home" }, { name: 1, price: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { name: rx("^Desk"), category: "home" },
          variants: [
            { category: "home", name: rx("^Desk") },
            { name: { $regex: "^Desk" }, category: "home" },
          ],
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: { kind: "projection", doc: { name: 1, price: 1 } },
      },
    ],
  },
  {
    id: "difficult-mul",
    title: "Double book stock",
    difficulty: "difficult",
    operation: "update",
    statement:
      "After a stock count, every product in the books category is found to hold twice as many units as recorded. Multiply their stock by 2.",
    clues: ["every product in the books category", "Multiply their stock by 2"],
    sql: "UPDATE products SET stock = stock * 2 WHERE category = 'books';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "`$mul` multiplies a numeric field by a factor.",
      "Use `updateMany` to change every books product.",
      "`{ $mul: { stock: 2 } }`.",
    ],
    referenceAnswer: 'db.products.updateMany({ category: "books" }, { $mul: { stock: 2 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "products" },
      },
      {
        id: "method",
        label: "Method",
        weight: 20,
        expectation: { kind: "method", method: "updateMany" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { category: "books" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $mul: { stock: 2 } } },
      },
    ],
  },
  {
    id: "difficult-not-anchored-regex",
    title: "Gift guide without the A-list",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Buying wants the gift guide to lead with products whose name does not begin with an A, and only the name and rating should reach the page.",
    clues: ["whose name does not begin with an A", "only the name and rating"],
    sql: "SELECT name, rating FROM products WHERE name NOT LIKE 'A%';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Negate a pattern on a field with `$not`.",
      "`{ name: { $not: /^A/ } }` inverts the anchored regex.",
      "Project `{ name: 1, rating: 1 }`.",
    ],
    referenceAnswer: 'db.products.find({ name: { $not: /^A/ } }, { name: 1, rating: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { name: { $not: rx("^A") } },
          variants: [{ name: { $not: { $regex: "^A" } } }],
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, rating: 1 },
          variants: [{ name: 1, rating: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-or-tier-city-projection",
    title: "Retention shortlist",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Growth wants a retention report: the customers who either live in Berlin or carry the \"vip\" tag, restricted to those whose account is still active, showing only their name and tier.",
    clues: [
      "who either live in Berlin or carry the \"vip\" tag",
      "whose account is still active",
      "showing only their name and tier",
    ],
    sql: "SELECT name, tier FROM customers WHERE (city = 'Berlin' OR tags LIKE '%vip%') AND active = TRUE;",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "Two alternatives on the same field go in an `$or` array of clause documents.",
      "`{ tags: \"vip\" }` already matches an array that contains the value.",
      "The `active` condition sits alongside the `$or`, not inside it.",
    ],
    referenceAnswer:
      'db.customers.find({ $or: [{ city: "Berlin" }, { tags: "vip" }], active: true }, { name: 1, tier: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "customers" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { $or: [{ city: "Berlin" }, { tags: "vip" }], active: true },
          variants: [
            { active: true, $or: [{ tags: "vip" }, { city: "Berlin" }] },
            { active: true, $or: [{ city: "Berlin" }, { tags: { $in: ["vip"] } }] },
          ],
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, tier: 1 },
          variants: [{ name: 1, tier: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-elemmatch-order-status",
    title: "High-value orders in flight",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Finance is chasing orders that either are still pending or have already shipped, and each of them must include a line item priced at 40 or more. Show only the customerId and total.",
    clues: [
      "either are still pending or have already shipped",
      "must include a line item priced at 40 or more",
      "only the customerId and total",
    ],
    sql: "SELECT customerId, total FROM orders WHERE status IN ('pending', 'shipped') AND EXISTS (SELECT 1 FROM items WHERE price >= 40);",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "Two statuses as alternatives make an `$or` of two equality clauses.",
      "One array element must clear the price bar: `items: { $elemMatch: { price: { $gte: 40 } } }`.",
      "Project `{ customerId: 1, total: 1 }`.",
    ],
    referenceAnswer:
      'db.orders.find({ $or: [{ status: "pending" }, { status: "shipped" }], items: { $elemMatch: { price: { $gte: 40 } } } }, { customerId: 1, total: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "orders" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: {
            $or: [{ status: "pending" }, { status: "shipped" }],
            items: { $elemMatch: { price: { $gte: 40 } } },
          },
          variants: [
            {
              items: { $elemMatch: { price: { $gte: 40 } } },
              $or: [{ status: "shipped" }, { status: "pending" }],
            },
          ],
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { customerId: 1, total: 1 },
          variants: [{ customerId: 1, total: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-nested-manager-projection",
    title: "Platform mentorship map",
    difficulty: "difficult",
    operation: "find",
    statement:
      "HR is building a mentorship map: the active engineers whose manager sits on the platform team, showing only their name and their manager's name.",
    clues: [
      "the active engineers whose manager sits on the platform team",
      "showing only their name and their manager's name",
    ],
    sql: "SELECT name, manager.name FROM employees WHERE department = 'engineering' AND active = TRUE AND manager.team = 'platform';",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "Two conditions on the staff member and one on their manager combine with an implicit AND.",
      "The manager condition uses a quoted dotted path: `\"manager.team\"`.",
      "A nested field can be projected too: `{ name: 1, \"manager.name\": 1 }`.",
    ],
    referenceAnswer:
      'db.employees.find({ department: "engineering", active: true, "manager.team": "platform" }, { name: 1, "manager.name": 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "employees" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { department: "engineering", active: true, "manager.team": "platform" },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, "manager.name": 1 },
          variants: [{ name: 1, "manager.name": 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-regex-gmail-or-rating",
    title: "Untrustworthy Gmail reviews",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Quality wants every review written by a Gmail customer that either scored 2 or fewer or was left unverified, showing only the productId and the rating.",
    clues: [
      "written by a Gmail customer",
      "either scored 2 or fewer or was left unverified",
      "showing only the productId and the rating",
    ],
    sql: "SELECT productId, rating FROM reviews WHERE LOWER(customer) LIKE '%gmail%' AND (rating <= 2 OR verified = FALSE);",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      "Match the address fragment with a case-insensitive regex: `/gmail/i`.",
      "Fold the two weak-review cases into an `$or` array.",
      "Project `{ productId: 1, rating: 1 }`.",
    ],
    referenceAnswer:
      'db.reviews.find({ customer: /gmail/i, $or: [{ rating: { $lte: 2 } }, { verified: false }] }, { productId: 1, rating: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "reviews" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { customer: rx("gmail", "i"), $or: [{ rating: { $lte: 2 } }, { verified: false }] },
          variants: [
            {
              $or: [{ rating: { $lte: 2 } }, { verified: false }],
              customer: { $regex: "gmail", $options: "i" },
            },
          ],
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { productId: 1, rating: 1 },
          variants: [{ productId: 1, rating: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-nested-meta-sort-limit",
    title: "Unassigned chat queue",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Support leadership wants the unassigned tickets that came in by chat or phone, newest first and capped at two results, showing only the subject and the first response time.",
    clues: [
      "the unassigned tickets that came in by chat or phone",
      "newest first and capped at two results",
      "showing only the subject and the first response time",
    ],
    sql: "SELECT subject, meta.firstResponseMins FROM tickets WHERE assignee IS NULL AND meta.channel IN ('chat', 'phone') ORDER BY created DESC LIMIT 2;",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "Nobody assigned means `assignee: null`.",
      "Reach into the sub-document with `\"meta.channel\"` and a list of two channels.",
      "Ordering and capping belong in the third argument: `{ sort: { created: -1 }, limit: 2 }`.",
    ],
    referenceAnswer:
      'db.tickets.find({ assignee: null, "meta.channel": { $in: ["chat", "phone"] } }, { subject: 1, "meta.firstResponseMins": 1 }, { sort: { created: -1 }, limit: 2 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "tickets" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { assignee: null, "meta.channel": { $in: ["chat", "phone"] } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { subject: 1, "meta.firstResponseMins": 1 },
          variants: [{ subject: 1, "meta.firstResponseMins": 1, _id: 0 }],
        },
      },
      {
        id: "options",
        label: "Options",
        expectation: { kind: "options", doc: { sort: { created: -1 }, limit: 2 } },
      },
    ],
  },
  {
    id: "difficult-or-session-duration",
    title: "Sticky or completed sessions",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Product analytics wants the sessions that either ran for 30 minutes or more, or that the visitor finished, showing only the userId and the durationMins.",
    clues: [
      "either ran for 30 minutes or more, or that the visitor finished",
      "showing only the userId and the durationMins",
    ],
    sql: "SELECT userId, durationMins FROM sessions WHERE durationMins >= 30 OR completed = TRUE;",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "A long session and a finished session are two alternatives, so they go in `$or`.",
      "The first clause is `{ durationMins: { $gte: 30 } }` and the second is `{ completed: true }`.",
      "Project `{ userId: 1, durationMins: 1 }`.",
    ],
    referenceAnswer:
      'db.sessions.find({ $or: [{ durationMins: { $gte: 30 } }, { completed: true }] }, { userId: 1, durationMins: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "sessions" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { $or: [{ durationMins: { $gte: 30 } }, { completed: true }] },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { userId: 1, durationMins: 1 },
          variants: [{ userId: 1, durationMins: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-elemmatch-invoice-lines",
    title: "Bulk euro receivables",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Collections wants the invoices that are overdue or draft and billed in euros, provided one line of at least 5 units is priced above 100, showing only the amount and the status.",
    clues: [
      "overdue or draft and billed in euros",
      "one line of at least 5 units is priced above 100",
      "showing only the amount and the status",
    ],
    sql: "SELECT amount, status FROM invoices WHERE status IN ('overdue', 'draft') AND currency = 'EUR' AND EXISTS (SELECT 1 FROM lines WHERE qty >= 5 AND unitPrice > 100);",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Two statuses as alternatives make an `$or` array; currency is a plain equality.",
      "Both line conditions must hold on the same element, so group them in `$elemMatch`.",
      "Project `{ amount: 1, status: 1 }`.",
    ],
    referenceAnswer:
      'db.invoices.find({ $or: [{ status: "overdue" }, { status: "draft" }], currency: "EUR", lines: { $elemMatch: { qty: { $gte: 5 }, unitPrice: { $gt: 100 } } } }, { amount: 1, status: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "invoices" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: {
            $or: [{ status: "overdue" }, { status: "draft" }],
            currency: "EUR",
            lines: { $elemMatch: { qty: { $gte: 5 }, unitPrice: { $gt: 100 } } },
          },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { amount: 1, status: 1 },
          variants: [{ amount: 1, status: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-nin-shipping-sort",
    title: "Highest non-gift order",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Fraud review wants the highest-version order that does not carry the \"gift\" tag and was not shipped to the United Kingdom, returned newest revision first with only the version field.",
    clues: [
      "does not carry the \"gift\" tag",
      "was not shipped to the United Kingdom",
      "only the version field",
    ],
    sql: "SELECT version FROM orders WHERE 'gift' NOT IN (tags) AND shipping.country <> 'UK' ORDER BY version DESC LIMIT 1;",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "Excluding a value from an array is `{ tags: { $nin: [\"gift\"] } }`.",
      "The country condition is a nested path with `$ne`: `\"shipping.country\": { $ne: \"UK\" }`.",
      "Sort and cap in the third argument: `{ sort: { version: -1 }, limit: 1 }`.",
    ],
    referenceAnswer:
      'db.orders.find({ tags: { $nin: ["gift"] }, "shipping.country": { $ne: "UK" } }, { version: 1, _id: 0 }, { sort: { version: -1 }, limit: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "orders" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { tags: { $nin: ["gift"] }, "shipping.country": { $ne: "UK" } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { version: 1, _id: 0 },
          variants: [{ version: 1 }],
        },
      },
      {
        id: "options",
        label: "Options",
        expectation: { kind: "options", doc: { sort: { version: -1 }, limit: 1 } },
      },
    ],
  },
  {
    id: "difficult-not-skill-salary",
    title: "Mid-level pay review",
    difficulty: "difficult",
    operation: "find",
    statement:
      "Compensation wants the list of staff who have never held a leadership skill and earn under 100000 a year, showing only their name and salary.",
    clues: [
      "who have never held a leadership skill",
      "earn under 100000 a year",
      "showing only their name and salary",
    ],
    sql: "SELECT name, salary FROM employees WHERE 'leadership' NOT IN (skills) AND salary < 100000;",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "On an array field, `{ skills: { $not: \"leadership\" } }` means no element equals that value.",
      "The pay ceiling is a second, independent condition.",
      "Project `{ name: 1, salary: 1 }`.",
    ],
    referenceAnswer:
      'db.employees.find({ skills: { $not: "leadership" }, salary: { $lt: 100000 } }, { name: 1, salary: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "employees" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { skills: { $not: "leadership" }, salary: { $lt: 100000 } },
          variants: [{ salary: { $lt: 100000 }, skills: { $not: "leadership" } }],
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, salary: 1 },
          variants: [{ name: 1, salary: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "difficult-pull-bulk-export-flag",
    title: "Strip priority tags",
    difficulty: "difficult",
    operation: "update",
    statement:
      "The data team is standardising order metadata: every order that carries the \"priority\" tag should lose that tag, and each of them should get a bulkExported flag set to true.",
    clues: [
      "every order that carries the \"priority\" tag should lose that tag",
      "each of them should get a bulkExported flag set to true",
    ],
    sql: "UPDATE orders SET tags = array_remove(tags, 'priority'), bulkExported = TRUE WHERE 'priority' IN (tags);",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "Removing a value from an array is `$pull`.",
      "Setting a brand new field is `$set`; the two operators share one update document.",
      "Target every matching order with `updateMany`.",
    ],
    referenceAnswer:
      'db.orders.updateMany({ tags: "priority" }, { $pull: { tags: "priority" }, $set: { bulkExported: true } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "orders" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { tags: "priority" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $pull: { tags: "priority" }, $set: { bulkExported: true } } },
      },
    ],
  },
  {
    id: "difficult-rename-unset",
    title: "CRM field migration",
    difficulty: "difficult",
    operation: "update",
    statement:
      "The CRM migration renames the age field to ageYears on the account for \"ben@example.com\" and drops the old city value entirely.",
    clues: ["renames the age field to ageYears", "drops the old city value"],
    sql: "UPDATE customers SET ageYears = age, city = NULL WHERE email = 'ben@example.com';",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "`$rename` moves a field to a new name and keeps its value.",
      "`$unset` removes a field; its operand is just an empty string.",
      "Both operators fit in the same update document on one `updateOne`.",
    ],
    referenceAnswer:
      'db.customers.updateOne({ email: "ben@example.com" }, { $rename: { age: "ageYears" }, $unset: { city: "" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "customers" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { email: "ben@example.com" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $rename: { age: "ageYears" }, $unset: { city: "" } } },
      },
    ],
  },
  {
    id: "difficult-nested-set-inc-team",
    title: "Revenue reorg stamp",
    difficulty: "difficult",
    operation: "update",
    statement:
      "The reorg marks every employee on the revenue team by setting manager.reorg to \"h2026\" and adds 3 to their years of service.",
    clues: [
      "every employee on the revenue team",
      "setting manager.reorg to \"h2026\"",
      "adds 3 to their years of service",
    ],
    sql: "UPDATE employees SET manager.reorg = 'h2026', yearsOfService = yearsOfService + 3 WHERE manager.team = 'revenue';",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "The team lives in a sub-document, so the filter uses `\"manager.team\"`.",
      "`$set` can write to a nested path the same way.",
      "`$inc` adds a number to a field; combine it with `$set` in one update document.",
    ],
    referenceAnswer:
      'db.employees.updateMany({ "manager.team": "revenue" }, { $set: { "manager.reorg": "h2026" }, $inc: { yearsOfService: 3 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "employees" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { "manager.team": "revenue" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: {
          kind: "update",
          doc: { $set: { "manager.reorg": "h2026" }, $inc: { yearsOfService: 3 } },
        },
      },
    ],
  },
  {
    id: "difficult-nested-set-addtoset-urgent",
    title: "Escalate urgent tickets",
    difficulty: "difficult",
    operation: "update",
    statement:
      "The helpdesk reclassifies tickets: every urgent ticket should have its meta.channel set to \"escalation\" and the \"escalated\" tag added without duplicating it if it is already there.",
    clues: [
      "every urgent ticket",
      "its meta.channel set to \"escalation\"",
      "the \"escalated\" tag added without duplicating it if it is already there",
    ],
    sql: "UPDATE tickets SET meta.channel = 'escalation', tags = array_append(tags, 'escalated') WHERE priority = 'urgent';",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "A dotted path works inside `$set` for a nested field.",
      "`$addToSet` appends only when the value is missing.",
      "The two operators share one update document and `updateMany` applies it to every urgent ticket.",
    ],
    referenceAnswer:
      'db.tickets.updateMany({ priority: "urgent" }, { $set: { "meta.channel": "escalation" }, $addToSet: { tags: "escalated" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "tickets" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { priority: "urgent" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: {
          kind: "update",
          doc: { $set: { "meta.channel": "escalation" }, $addToSet: { tags: "escalated" } },
        },
      },
    ],
  },
  {
    id: "difficult-mul-upsert-vat",
    title: "VAT uplift on unpaid invoices",
    difficulty: "difficult",
    operation: "update",
    statement:
      "Finance is applying the new VAT uplift: every unpaid invoice has its tax multiplied by 1.2 and its status set to \"pending-verification\", inserting a placeholder record if nothing matches.",
    clues: [
      "every unpaid invoice has its tax multiplied by 1.2",
      "its status set to \"pending-verification\"",
      "inserting a placeholder record if nothing matches",
    ],
    sql: "UPDATE invoices SET tax = tax * 1.2, status = 'pending-verification' WHERE status = 'unpaid';",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Scaling a number in place is `$mul`.",
      "Pair it with `$set` for the status change in the same update document.",
      "Insert-if-missing is the third argument: `{ upsert: true }`.",
    ],
    referenceAnswer:
      'db.invoices.updateMany({ status: "unpaid" }, { $mul: { tax: 1.2 }, $set: { status: "pending-verification" } }, { upsert: true })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "invoices" },
      },
      {
        id: "method",
        label: "Method",
        weight: 15,
        expectation: { kind: "method", method: "updateMany" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 25,
        expectation: { kind: "filter", doc: { status: "unpaid" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 35,
        expectation: {
          kind: "update",
          doc: { $mul: { tax: 1.2 }, $set: { status: "pending-verification" } },
        },
      },
      {
        id: "options",
        label: "Options",
        weight: 15,
        expectation: { kind: "options", doc: { upsert: true } },
      },
    ],
  },
  {
    id: "difficult-min-max-hygiene",
    title: "Catalog value guardrails",
    difficulty: "difficult",
    operation: "update",
    statement:
      "A data-hygiene sweep caps the whole catalog: no product may report a rating above 5, and every product's stock is topped up to at least 25.",
    clues: ["no product may report a rating above 5", "every product's stock is topped up to at least 25"],
    sql: "UPDATE products SET rating = LEAST(rating, 5), stock = GREATEST(stock, 25);",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "An empty filter document `{}` targets every document in the collection.",
      "`$min` lowers a field only when the given value is smaller; `$max` raises it only when larger.",
      "Two update operators, one document: `{ $min: { rating: 5 }, $max: { stock: 25 } }`.",
    ],
    referenceAnswer: "db.products.updateMany({}, { $min: { rating: 5 }, $max: { stock: 25 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: {} },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $min: { rating: 5 }, $max: { stock: 25 } } },
      },
    ],
  },
  {
    id: "difficult-inc-set-incomplete-session",
    title: "Credit abandoned sessions",
    difficulty: "difficult",
    operation: "update",
    statement:
      "Growth credits every session that was never completed with ten extra minutes of duration and records a followUpNeeded flag set to true on it.",
    clues: [
      "every session that was never completed",
      "with ten extra minutes of duration",
      "records a followUpNeeded flag set to true on it",
    ],
    sql: "UPDATE sessions SET durationMins = durationMins + 10, followUpNeeded = TRUE WHERE completed = FALSE;",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "Never finished means `completed: false`.",
      "`$inc` adds a number in place; `$set` writes the new flag.",
      "Both operators belong in the same update document on `updateMany`.",
    ],
    referenceAnswer:
      'db.sessions.updateMany({ completed: false }, { $inc: { durationMins: 10 }, $set: { followUpNeeded: true } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "sessions" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { completed: false } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: {
          kind: "update",
          doc: { $inc: { durationMins: 10 }, $set: { followUpNeeded: true } },
        },
      },
    ],
  },
  {
    id: "difficult-unset-one-star-helpful",
    title: "Flag worthless reviews",
    difficulty: "difficult",
    operation: "update",
    statement:
      "The trust team flags every one-star review that nobody found helpful: set flagged to true and remove the helpful count entirely.",
    clues: [
      "every one-star review that nobody found helpful",
      "set flagged to true",
      "remove the helpful count entirely",
    ],
    sql: "UPDATE reviews SET flagged = TRUE, helpful = NULL WHERE rating = 1 AND helpful = 0;",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      "The two review conditions are an implicit AND in one filter document.",
      "`$unset` drops a field entirely; its operand is an empty string.",
      "Write the new flag with `$set` alongside the `$unset` in the same update document.",
    ],
    referenceAnswer:
      'db.reviews.updateMany({ rating: 1, helpful: 0 }, { $set: { flagged: true }, $unset: { helpful: "" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "reviews" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { rating: 1, helpful: 0 } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { flagged: true }, $unset: { helpful: "" } } },
      },
    ],
  },
  {
    id: "difficult-nested-shipping-upsert",
    title: "Correct a delivery address",
    difficulty: "difficult",
    operation: "update",
    statement:
      "The address service corrects the destination for the order belonging to customer 3: set shipping.city to \"Munich\" and shipping.country to \"Germany\", creating the order record if it is not there yet.",
    clues: [
      "the order belonging to customer 3",
      "set shipping.city to \"Munich\" and shipping.country to \"Germany\"",
      "creating the order record if it is not there yet",
    ],
    sql: "UPDATE orders SET shipping.city = 'Munich', shipping.country = 'Germany' WHERE customerId = 3;",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "A single `customerId` value identifies the order, so `updateOne` is enough.",
      "`$set` accepts two dotted paths in the same document.",
      "Add `{ upsert: true }` as a third argument to allow the insert.",
    ],
    referenceAnswer:
      'db.orders.updateOne({ customerId: 3 }, { $set: { "shipping.city": "Munich", "shipping.country": "Germany" } }, { upsert: true })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "orders" },
      },
      { id: "method", label: "Method", weight: 15, expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 25,
        expectation: { kind: "filter", doc: { customerId: 3 } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 35,
        expectation: {
          kind: "update",
          doc: { $set: { "shipping.city": "Munich", "shipping.country": "Germany" } },
        },
      },
      {
        id: "options",
        label: "Options",
        weight: 15,
        expectation: { kind: "options", doc: { upsert: true } },
      },
    ],
  },
  {
    id: "difficult-in-active-quarantine",
    title: "Quarantine dormant accounts",
    difficulty: "difficult",
    operation: "update",
    statement:
      "Marketing quarantines the dormant accounts: every basic or trial customer who is no longer active should be flagged with quarantineOn set to \"2026-06-01\" and gain the \"dormant\" tag.",
    clues: [
      "every basic or trial customer who is no longer active",
      "flagged with quarantineOn set to \"2026-06-01\"",
      "gain the \"dormant\" tag",
    ],
    sql: "UPDATE customers SET quarantineOn = DATE '2026-06-01', tags = array_append(tags, 'dormant') WHERE tier IN ('basic', 'trial') AND active = FALSE;",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "A list of two tiers is a `$in` condition, and dormancy is a `false` on `active`.",
      "`$set` writes the new marker field.",
      "`$addToSet` adds the tag only if the customer does not already carry it.",
    ],
    referenceAnswer:
      'db.customers.updateMany({ tier: { $in: ["basic", "trial"] }, active: false }, { $set: { quarantineOn: "2026-06-01" }, $addToSet: { tags: "dormant" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "customers" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { tier: { $in: ["basic", "trial"] }, active: false } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: {
          kind: "update",
          doc: { $set: { quarantineOn: "2026-06-01" }, $addToSet: { tags: "dormant" } },
        },
      },
    ],
  },
];
