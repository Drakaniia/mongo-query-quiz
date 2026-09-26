import type { Problem } from "../types.js";
import {
  CUSTOMERS,
  EMPLOYEES,
  INVOICES,
  ORDERS,
  PRODUCTS,
  REVIEWS,
  SESSIONS,
  TICKETS,
  withNumericIds,
} from "./datasets.js";

/**
 * Easy problems show short numeric ids, so matching `_id` never asks a beginner to write a
 * 24-character `ObjectId(...)` literal. The shared datasets keep their ObjectId values for the
 * moderate and difficult problems.
 */
const CUSTOMERS_SIMPLE = withNumericIds(CUSTOMERS);
const ORDERS_SIMPLE = withNumericIds(ORDERS);

export const easyProblems: Problem[] = [
  {
    id: "easy-category-equality",
    title: "Books in the catalogue",
    difficulty: "easy",
    operation: "find",
    statement:
      "The merchandising team wants to review every product that belongs to the books category. Write the MongoDB query that returns those documents.",
    clues: ["every product that belongs to the books category"],
    sql: "SELECT * FROM products WHERE category = 'books';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Start with `db.products.find(...)`.",
      "An equality filter is a document of `{ field: value }`.",
      'Filter on `category` with the string "books".',
    ],
    referenceAnswer: 'db.products.find({ category: "books" })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { category: "books" } },
      },
    ],
  },
  {
    id: "easy-price-less-than",
    title: "Bargain bin",
    difficulty: "easy",
    operation: "find",
    statement:
      "The storefront wants to feature every product priced under 20. Return all matching products.",
    clues: ["every product priced under 20"],
    sql: "SELECT * FROM products WHERE price < 20;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Comparison operators live inside the field value.",
      'The "less than" operator is `$lt`.',
      "Write `{ price: { $lt: 20 } }`.",
    ],
    referenceAnswer: "db.products.find({ price: { $lt: 20 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { price: { $lt: 20 } } },
      },
    ],
  },
  {
    id: "easy-drop-order-version",
    title: "Retire the order version field",
    difficulty: "easy",
    operation: "update",
    statement:
      "The order team no longer tracks revisions, so the version field must be removed from every order that has already shipped.",
    clues: ["the version field must be removed from every order that has already shipped"],
    sql: "UPDATE orders SET version = NULL WHERE status = 'shipped';",
    collection: "orders",
    sampleDocuments: ORDERS_SIMPLE,
    hints: [
      "More than one order matches, so use `db.orders.updateMany(filter, update)`.",
      "The `$unset` operator deletes a field.",
      '`$unset` ignores its operand, so the convention is an empty string: `{ $unset: { version: "" } }`.',
    ],
    referenceAnswer: 'db.orders.updateMany({ status: "shipped" }, { $unset: { version: "" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "orders" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { status: "shipped" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $unset: { version: "" } } },
      },
    ],
  },
  {
    id: "easy-findone-by-id",
    title: "Open a customer profile",
    difficulty: "easy",
    operation: "find",
    statement:
      "A support agent opens a single customer profile from the CRM. Fetch the one customer whose _id is 101.",
    clues: ["the one customer whose _id is 101"],
    sql: "SELECT * FROM customers WHERE _id = 101;",
    collection: "customers",
    sampleDocuments: CUSTOMERS_SIMPLE,
    hints: [
      "When you expect at most one document, `findOne` is the natural method.",
      "The id is the short number 101, so match `_id` with the plain value from the sample documents.",
      "There is exactly one match, so `find` is also accepted here.",
    ],
    referenceAnswer: "db.customers.findOne({ _id: 101 })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "customers" },
      },
      {
        id: "method",
        label: "Method",
        expectation: { kind: "method", method: "findOne", equivalents: ["find"] },
      },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { _id: 101 } },
      },
    ],
  },
  {
    id: "easy-projection",
    title: "Names and emails only",
    difficulty: "easy",
    operation: "find",
    statement:
      "The marketing export only needs two fields per customer. Return just the name and email of every customer.",
    clues: ["just the name and email of every customer"],
    sql: "SELECT name, email FROM customers;",
    collection: "customers",
    sampleDocuments: CUSTOMERS_SIMPLE,
    hints: [
      "Projection is the second argument to `find`.",
      "Include a field by setting it to `1`.",
      "An empty filter `{}` returns every document.",
    ],
    referenceAnswer: "db.customers.find({}, { name: 1, email: 1 })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "customers" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, email: 1 },
          variants: [{ name: 1, email: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "easy-deactivate-customer",
    title: "Deactivate a customer",
    difficulty: "easy",
    operation: "update",
    statement:
      'A customer asked to be removed from all campaigns. Set the active flag of the account with email "carol@example.com" to false.',
    clues: ['Set the active flag of the account with email "carol@example.com" to false'],
    sql: "UPDATE customers SET active = false WHERE email = 'carol@example.com';",
    collection: "customers",
    sampleDocuments: CUSTOMERS_SIMPLE,
    hints: [
      "Use `db.customers.updateOne(filter, update)`.",
      "The `$set` operator assigns field values.",
      "`{ $set: { active: false } }`.",
    ],
    referenceAnswer:
      'db.customers.updateOne({ email: "carol@example.com" }, { $set: { active: false } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "customers" },
      },
      {
        id: "method",
        label: "Method",
        weight: 20,
        expectation: { kind: "method", method: "updateOne" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { email: "carol@example.com" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { active: false } } },
      },
    ],
  },
  {
    id: "easy-in-stock",
    title: "Everything in stock",
    difficulty: "easy",
    operation: "find",
    statement:
      "The warehouse dashboard needs every product that currently has stock on hand, meaning a stock value greater than zero.",
    clues: ["every product that currently has stock on hand", "a stock value greater than zero"],
    sql: "SELECT * FROM products WHERE stock > 0;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Use a comparison operator on `stock`.",
      'The "greater than" operator is `$gt`.',
      "Zero is the threshold, and the comparison is strict.",
    ],
    referenceAnswer: "db.products.find({ stock: { $gt: 0 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { stock: { $gt: 0 } } },
      },
    ],
  },
  {
    id: "easy-well-rated",
    title: "Highly rated products",
    difficulty: "easy",
    operation: "find",
    statement:
      "A recommendation widget only shows products rated 4.5 or higher. Return those products.",
    clues: ["products rated 4.5 or higher"],
    sql: "SELECT * FROM products WHERE rating >= 4.5;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      '"At least" means greater than or equal to.',
      "Use `$gte`.",
      "`{ rating: { $gte: 4.5 } }`.",
    ],
    referenceAnswer: "db.products.find({ rating: { $gte: 4.5 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { rating: { $gte: 4.5 } } },
      },
    ],
  },
  {
    id: "easy-clear-clearance-stock",
    title: "Zero out clearance stock",
    difficulty: "easy",
    operation: "update",
    statement:
      "The clearance range has been pulled from sale, so reset the stock of every product in the clearance category to 0.",
    clues: ["reset the stock of every product in the clearance category to 0"],
    sql: "UPDATE products SET stock = 0 WHERE category = 'clearance';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Several documents change at once, so use `updateMany`.",
      'Filter on `{ category: "clearance" }`.',
      "Use `$set` to assign the new stock value.",
    ],
    referenceAnswer: 'db.products.updateMany({ category: "clearance" }, { $set: { stock: 0 } })',
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
        expectation: { kind: "filter", doc: { category: "clearance" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { stock: 0 } } },
      },
    ],
  },
  {
    id: "easy-restock-atlas",
    title: "Restock the Atlas of Maps",
    difficulty: "easy",
    operation: "update",
    statement:
      "The warehouse booked in five more copies of the Atlas of Maps, so the stock on hand for sku P-100 has to grow by five.",
    clues: ["the stock on hand for sku P-100 has to grow by five"],
    sql: "UPDATE products SET stock = stock + 5 WHERE sku = 'P-100';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Only one product matches, so use `db.products.updateOne(filter, update)`.",
      "The `$inc` operator adds a number to a field instead of replacing it.",
      "`{ $inc: { stock: 5 } }` increases the existing value by five.",
    ],
    referenceAnswer: 'db.products.updateOne({ sku: "P-100" }, { $inc: { stock: 5 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { sku: "P-100" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $inc: { stock: 5 } } },
      },
    ],
  },
  {
    id: "easy-tag-gold-customers",
    title: "Tag the gold tier",
    difficulty: "easy",
    operation: "update",
    statement:
      "Campaigns now target a platinum segment, so the tag platinum has to be added to the account of the customer on the gold tier.",
    clues: ["the tag platinum has to be added to the account of the customer on the gold tier"],
    sql: "UPDATE customers SET tags = 'platinum' WHERE tier = 'gold';",
    collection: "customers",
    sampleDocuments: CUSTOMERS_SIMPLE,
    hints: [
      "The gold tier is a single account, so use `db.customers.updateOne(filter, update)`.",
      "`$addToSet` appends a value to an array field, but only when it is not there already.",
      '`{ $addToSet: { tags: "platinum" } }` keeps the array free of duplicates.',
    ],
    referenceAnswer:
      'db.customers.updateOne({ tier: "gold" }, { $addToSet: { tags: "platinum" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "customers" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { tier: "gold" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $addToSet: { tags: "platinum" } } },
      },
    ],
  },
  {
    id: "easy-customers-over-40",
    title: "Account ownership review",
    difficulty: "easy",
    operation: "find",
    statement:
      "The compliance team needs a list of every customer older than 40 so they can review account ownership.",
    clues: ["every customer older than 40"],
    sql: "SELECT * FROM customers WHERE age > 40;",
    collection: "customers",
    sampleDocuments: CUSTOMERS_SIMPLE,
    hints: [
      "Reach for a comparison operator on `age`.",
      '"Older than" is a strict comparison, so `$gt`.',
      "`{ age: { $gt: 40 } }`.",
    ],
    referenceAnswer: "db.customers.find({ age: { $gt: 40 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "customers" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { age: { $gt: 40 } } },
      },
    ],
  },
  {
    id: "easy-upgrade-customer-tier",
    title: "Move a customer up a tier",
    difficulty: "easy",
    operation: "update",
    statement:
      'The retention team has upgraded Dana Scully. Set the tier of the account with email "dana@example.com" to "pro".',
    clues: ['Set the tier of the account with email "dana@example.com" to "pro"'],
    sql: "UPDATE customers SET tier = 'pro' WHERE email = 'dana@example.com';",
    collection: "customers",
    sampleDocuments: CUSTOMERS_SIMPLE,
    hints: [
      "Only one account changes, so `updateOne` is right.",
      "The filter uses an equality match on `email`.",
      '`{ $set: { tier: "pro" } }` assigns the new plan.',
    ],
    referenceAnswer:
      'db.customers.updateOne({ email: "dana@example.com" }, { $set: { tier: "pro" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "customers" },
      },
      {
        id: "method",
        label: "Method",
        weight: 20,
        expectation: { kind: "method", method: "updateOne" },
      },
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
        expectation: { kind: "update", doc: { $set: { tier: "pro" } } },
      },
    ],
  },
  {
    id: "easy-big-ticket-orders",
    title: "Big-ticket order watchlist",
    difficulty: "easy",
    operation: "find",
    statement:
      "The finance team flags big-ticket activity and needs every order with a total of at least 200.",
    clues: ["every order with a total of at least 200"],
    sql: "SELECT * FROM orders WHERE total >= 200;",
    collection: "orders",
    sampleDocuments: ORDERS_SIMPLE,
    hints: [
      "Filter on the numeric `total` field.",
      '"At least" is an inclusive comparison, so `$gte`.',
      "`{ total: { $gte: 200 } }`.",
    ],
    referenceAnswer: "db.orders.find({ total: { $gte: 200 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "orders" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { total: { $gte: 200 } } },
      },
    ],
  },
  {
    id: "easy-surcharge-pending-orders",
    title: "Add a surcharge to pending orders",
    difficulty: "easy",
    operation: "update",
    statement:
      "A fuel surcharge of 10 was announced for every order that is still pending, so each of those totals has to grow by 10.",
    clues: ["every order that is still pending", "each of those totals has to grow by 10"],
    sql: "UPDATE orders SET total = total + 10 WHERE status = 'pending';",
    collection: "orders",
    sampleDocuments: ORDERS_SIMPLE,
    hints: [
      "Several orders are still pending, so use `updateMany`.",
      '`$inc` adds to the current value, which is what "grow by 10" asks for.',
      "`{ $inc: { total: 10 } }` raises each matching total without overwriting it.",
    ],
    referenceAnswer: 'db.orders.updateMany({ status: "pending" }, { $inc: { total: 10 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "orders" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { status: "pending" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $inc: { total: 10 } } },
      },
    ],
  },
  {
    id: "easy-confirm-order-delivered",
    title: "Confirm a hand-off",
    difficulty: "easy",
    operation: "update",
    statement:
      'The courier signed for the order with _id 102. Record the hand-off by setting its status to "delivered".',
    clues: ["the order with _id 102", 'setting its status to "delivered"'],
    sql: "UPDATE orders SET status = 'delivered' WHERE _id = 102;",
    collection: "orders",
    sampleDocuments: ORDERS_SIMPLE,
    hints: [
      "A single order changes, so use `updateOne`.",
      "Match the order on `_id` with the plain number 102 shown in the sample documents.",
      'The update is `{ $set: { status: "delivered" } }`.',
    ],
    referenceAnswer: 'db.orders.updateOne({ _id: 102 }, { $set: { status: "delivered" } })',
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
        weight: 20,
        expectation: { kind: "method", method: "updateOne" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { _id: 102 } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { status: "delivered" } } },
      },
    ],
  },
  {
    id: "easy-engineering-remote",
    title: "Mark engineering as remote",
    difficulty: "easy",
    operation: "update",
    statement:
      "Engineering has moved to fully remote working, so everyone in the engineering department needs the remote flag turned on.",
    clues: ["everyone in the engineering department needs the remote flag turned on"],
    sql: "UPDATE employees SET remote = 1 WHERE department = 'engineering';",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "The whole department changes, so use `db.employees.updateMany(filter, update)`.",
      "The `$set` operator writes the value you give it.",
      "`{ $set: { remote: true } }` flips the boolean flag on every match.",
    ],
    referenceAnswer:
      'db.employees.updateMany({ department: "engineering" }, { $set: { remote: true } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "employees" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { department: "engineering" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $set: { remote: true } } },
      },
    ],
  },
  {
    id: "easy-high-salary-staff",
    title: "Top earners review",
    difficulty: "easy",
    operation: "find",
    statement: "Compensation wants a list of every employee earning 130000 or more a year.",
    clues: ["every employee earning 130000 or more a year"],
    sql: "SELECT * FROM employees WHERE salary >= 130000;",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "The base pay lives in the `salary` field.",
      '"Or more" means greater than or equal to, so `$gte`.',
      "`{ salary: { $gte: 130000 } }`.",
    ],
    referenceAnswer: "db.employees.find({ salary: { $gte: 130000 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "employees" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { salary: { $gte: 130000 } } },
      },
    ],
  },
  {
    id: "easy-critical-reviews",
    title: "Read the critical reviews",
    difficulty: "easy",
    operation: "find",
    statement:
      "The product team wants to read every review that scored 2 or less, showing only the productId and the rating.",
    clues: ["every review that scored 2 or less", "showing only the productId and the rating"],
    sql: "SELECT productId, rating FROM reviews WHERE rating <= 2;",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      '"Scored 2 or less" is an inclusive upper bound.',
      "The operator is `$lte`, and the field is `rating`.",
      "`{ rating: { $lte: 2 } }` then `{ productId: 1, rating: 1 }`.",
    ],
    referenceAnswer: "db.reviews.find({ rating: { $lte: 2 } }, { productId: 1, rating: 1 })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "reviews" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { rating: { $lte: 2 } } },
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
    id: "easy-verify-pen-review",
    title: "Confirm a purchase on a review",
    difficulty: "easy",
    operation: "update",
    statement:
      "Support matched the receipt for the review with _id 6, so that review is no longer unverified and its verified flag has to be turned on.",
    clues: ["the review with _id 6", "its verified flag has to be turned on"],
    sql: "UPDATE reviews SET verified = 1 WHERE _id = 6;",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      "A single review changes, so use `db.reviews.updateOne(filter, update)`.",
      "Match the review on `_id` with the plain number 6 from the sample documents.",
      "The update is `{ $set: { verified: true } }`.",
    ],
    referenceAnswer: "db.reviews.updateOne({ _id: 6 }, { $set: { verified: true } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "reviews" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { _id: 6 } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $set: { verified: true } } },
      },
    ],
  },
  {
    id: "easy-close-refund-ticket",
    title: "Close the refund ticket",
    difficulty: "easy",
    operation: "update",
    statement:
      'The refund on the ticket with _id 5 was paid out, so that ticket is finished and its status has to be set to "closed".',
    clues: ["the ticket with _id 5", 'its status has to be set to "closed"'],
    sql: "UPDATE tickets SET status = 'closed' WHERE _id = 5;",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "A single ticket changes, so use `db.tickets.updateOne(filter, update)`.",
      "Ticket ids are plain numbers, so match `_id` with the plain value 5.",
      'The update is `{ $set: { status: "closed" } }`.',
    ],
    referenceAnswer: 'db.tickets.updateOne({ _id: 5 }, { $set: { status: "closed" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "tickets" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { _id: 5 } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $set: { status: "closed" } } },
      },
    ],
  },
  {
    id: "easy-clear-ticket-assignee",
    title: "Clear a closed ticket's assignee",
    difficulty: "easy",
    operation: "update",
    statement:
      "Ticket _id 3 is closed, so the agent who owned it should no longer be recorded and the assignee field has to be removed from it.",
    clues: ["the assignee field has to be removed from it"],
    sql: "UPDATE tickets SET assignee = NULL WHERE _id = 3;",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "A single ticket changes, so use `db.tickets.updateOne(filter, update)`.",
      "The `$unset` operator deletes a field outright.",
      '`$unset` ignores its operand, so the convention is an empty string: `{ $unset: { assignee: "" } }`.',
    ],
    referenceAnswer: 'db.tickets.updateOne({ _id: 3 }, { $unset: { assignee: "" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "tickets" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { _id: 3 } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $unset: { assignee: "" } } },
      },
    ],
  },
  {
    id: "easy-long-sessions",
    title: "Long session report",
    difficulty: "easy",
    operation: "find",
    statement:
      "Product analytics wants every user session lasting at least 30 minutes, showing only the userId and the duration.",
    clues: [
      "every user session lasting at least 30 minutes",
      "showing only the userId and the duration",
    ],
    sql: "SELECT userId, durationMins FROM sessions WHERE durationMins >= 30;",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "Session length is stored in `durationMins`.",
      '"At least" means the inclusive comparison `$gte`.',
      "`{ durationMins: { $gte: 30 } }` then `{ userId: 1, durationMins: 1 }`.",
    ],
    referenceAnswer:
      "db.sessions.find({ durationMins: { $gte: 30 } }, { userId: 1, durationMins: 1 })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "sessions" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { durationMins: { $gte: 30 } } },
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
    id: "easy-complete-session",
    title: "Mark a session completed",
    difficulty: "easy",
    operation: "update",
    statement:
      "The user came back and finished the flow, so the session with _id 4 is over and its completed flag has to be turned on.",
    clues: ["the session with _id 4", "its completed flag has to be turned on"],
    sql: "UPDATE sessions SET completed = 1 WHERE _id = 4;",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "A single session changes, so use `db.sessions.updateOne(filter, update)`.",
      "Session ids are plain numbers, so match `_id` with the plain value 4.",
      "The update is `{ $set: { completed: true } }`.",
    ],
    referenceAnswer: "db.sessions.updateOne({ _id: 4 }, { $set: { completed: true } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "sessions" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { _id: 4 } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $set: { completed: true } } },
      },
    ],
  },
  {
    id: "easy-overdue-late-fee",
    title: "Charge a late fee on overdue invoices",
    difficulty: "easy",
    operation: "update",
    statement:
      "A late fee of 50 was added to every invoice marked overdue, so each of those amounts has to grow by 50.",
    clues: ["every invoice marked overdue", "each of those amounts has to grow by 50"],
    sql: "UPDATE invoices SET amount = amount + 50 WHERE status = 'overdue';",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Every overdue invoice is affected, so use `updateMany`.",
      "`$inc` adds to the current value rather than replacing it.",
      "`{ $inc: { amount: 50 } }` raises each matching amount by the fee.",
    ],
    referenceAnswer: 'db.invoices.updateMany({ status: "overdue" }, { $inc: { amount: 50 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "invoices" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { status: "overdue" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $inc: { amount: 50 } } },
      },
    ],
  },
  {
    id: "easy-large-invoices",
    title: "Material invoices for audit",
    difficulty: "easy",
    operation: "find",
    statement:
      "The auditors want every invoice whose amount is more than 1000 before they sign off the quarter.",
    clues: ["every invoice whose amount is more than 1000"],
    sql: "SELECT * FROM invoices WHERE amount > 1000;",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Compare the numeric `amount` field against a threshold.",
      '"More than" is a strict comparison, so `$gt`.',
      "`{ amount: { $gt: 1000 } }`.",
    ],
    referenceAnswer: "db.invoices.find({ amount: { $gt: 1000 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "invoices" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { amount: { $gt: 1000 } } },
      },
    ],
  },
  {
    id: "easy-low-stock-list",
    title: "Replenishment shortlist",
    difficulty: "easy",
    operation: "find",
    statement:
      "Merchandising wants a replenishment list of every product with fewer than 10 units on hand, showing only the sku and the stock.",
    clues: ["every product with fewer than 10 units on hand", "showing only the sku and the stock"],
    sql: "SELECT sku, stock FROM products WHERE stock < 10;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Units on hand are stored in `stock`.",
      '"Fewer than" is a strict comparison, so `$lt`.',
      "`{ stock: { $lt: 10 } }` then `{ sku: 1, stock: 1 }`.",
    ],
    referenceAnswer: "db.products.find({ stock: { $lt: 10 } }, { sku: 1, stock: 1 })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { stock: { $lt: 10 } } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { sku: 1, stock: 1 },
          variants: [{ sku: 1, stock: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "easy-product-by-sku",
    title: "Look up one product by sku",
    difficulty: "easy",
    operation: "find",
    statement:
      'The returns desk needs the name and the price of the single product with the sku "P-103".',
    clues: ['the single product with the sku "P-103"', "the name and the price"],
    sql: "SELECT name, price FROM products WHERE sku = 'P-103';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "A stock code is just a string field, so match it with an equality filter.",
      "Only two fields are needed, so pass a projection too.",
      '`db.products.findOne({ sku: "P-103" }, { name: 1, price: 1 })`.',
    ],
    referenceAnswer: 'db.products.findOne({ sku: "P-103" }, { name: 1, price: 1 })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      {
        id: "method",
        label: "Method",
        expectation: { kind: "method", method: "findOne", equivalents: ["find"] },
      },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { sku: "P-103" } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, price: 1 },
          variants: [{ name: 1, price: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "easy-premium-shelf",
    title: "In-store premium shelf",
    difficulty: "easy",
    operation: "find",
    statement:
      "The in-store premium shelf lists anything over 30, so return every product that costs more than 30.",
    clues: ["every product that costs more than 30"],
    sql: "SELECT * FROM products WHERE price > 30;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Use the `price` field for the comparison.",
      '"More than" is strict, so use `$gt` rather than `$gte`.',
      "`{ price: { $gt: 30 } }`.",
    ],
    referenceAnswer: "db.products.find({ price: { $gt: 30 } })",
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { price: { $gt: 30 } } },
      },
    ],
  },
  {
    id: "easy-reprice-notebook",
    title: "Apply a price cut",
    difficulty: "easy",
    operation: "update",
    statement:
      'The pricing team has approved a promotion. Set the price of the product with the sku "P-102" to 10.',
    clues: ['Set the price of the product with the sku "P-102" to 10'],
    sql: "UPDATE products SET price = 10 WHERE sku = 'P-102';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "One product changes, so `updateOne` is the right method.",
      "Identify it with an equality filter on `sku`.",
      "`{ $set: { price: 10 } }`.",
    ],
    referenceAnswer: 'db.products.updateOne({ sku: "P-102" }, { $set: { price: 10 } })',
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
        expectation: { kind: "method", method: "updateOne" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { sku: "P-102" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { price: 10 } } },
      },
    ],
  },
];
