import type { Problem } from "../types.js";
import { objectId, rx } from "../values.js";
import {
  CUSTOMERS,
  EMPLOYEES,
  INVOICES,
  ORDERS,
  PRODUCTS,
  REVIEWS,
  SESSIONS,
  TICKETS,
} from "./datasets.js";

export const moderateProblems: Problem[] = [
  {
    id: "moderate-implicit-and",
    title: "Low stock, high price",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Pricing wants products that are expensive but nearly sold out: priced at 20 or more while stock is below 10. Return every match.",
    clues: ["priced at 20 or more while stock is below 10"],
    sql: "SELECT * FROM products WHERE price >= 20 AND stock < 10;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Two conditions on different fields can live in one filter document.",
      "Top-level keys are combined with an implicit AND.",
      "Use `$gte` for price and `$lt` for stock.",
    ],
    referenceAnswer: "db.products.find({ price: { $gte: 20 }, stock: { $lt: 10 } })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { price: { $gte: 20 }, stock: { $lt: 10 } } },
      },
    ],
  },
  {
    id: "moderate-or",
    title: "Everything except the pen",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A stock take wants every product that is not the Pen, plus anything that has run out completely. Return all matches.",
    clues: ["every product that is not the Pen", "anything that has run out completely"],
    sql: "SELECT * FROM products WHERE name != 'Pen' OR stock = 0;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Two alternatives call for `$or` with an array of clauses.",
      'The "not equal" operator is `$ne`.',
      "The second clause is an equality on `stock`.",
    ],
    referenceAnswer: 'db.products.find({ $or: [{ name: { $ne: "Pen" } }, { stock: 0 }] })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { $or: [{ name: { $ne: "Pen" } }, { stock: 0 }] },
        },
      },
    ],
  },
  {
    id: "moderate-between",
    title: "Mid-range stock",
    difficulty: "moderate",
    operation: "find",
    statement:
      "The replenishment report covers products with a stock level between 5 and 15 inclusive. Return those products.",
    clues: ["a stock level between 5 and 15 inclusive"],
    sql: "SELECT * FROM products WHERE stock BETWEEN 5 AND 15;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "SQL `BETWEEN` is inclusive at both ends.",
      "Combine `$gte` and `$lte` on the same field.",
      "Both operators can share one value document.",
    ],
    referenceAnswer: "db.products.find({ stock: { $gte: 5, $lte: 15 } })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { stock: { $gte: 5, $lte: 15 } },
          variants: [
            { stock: { $lte: 15, $gte: 5 } },
            { $and: [{ stock: { $gte: 5 } }, { stock: { $lte: 15 } }] },
          ],
        },
      },
    ],
  },
  {
    id: "moderate-regex-tags",
    title: "Practice products",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A landing page shows any product whose tags mention \"practice\". Tags are an array, so match on the pattern anywhere in a tag.",
    clues: ['any product whose tags mention "practice"'],
    sql: "SELECT * FROM products WHERE tags LIKE '%practice%';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Pattern matching uses a regular expression.",
      "A regex literal is written `/pattern/`.",
      "The pattern `practice` matches anywhere in the string.",
    ],
    referenceAnswer: "db.products.find({ tags: /practice/ })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { tags: rx("practice") },
          variants: [{ tags: { $regex: "practice" } }, { tags: { $regex: rx("practice") } }],
        },
      },
    ],
  },
  {
    id: "moderate-in-nin",
    title: "Books or toys, not free",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Build a gift guide from the books and toys categories, excluding anything recorded at a price of 0.",
    clues: ["from the books and toys categories", "excluding anything recorded at a price of 0"],
    sql: "SELECT * FROM products WHERE category IN ('books', 'toys') AND price NOT IN (0);",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "`$in` matches any value in a list; `$nin` is its negation.",
      "Use `{ $in: [...] }` for the category list.",
      "Use `{ $nin: [0] }` to exclude zero prices.",
    ],
    referenceAnswer:
      'db.products.find({ category: { $in: ["books", "toys"] }, price: { $nin: [0] } })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { category: { $in: ["books", "toys"] }, price: { $nin: [0] } },
        },
      },
    ],
  },
  {
    id: "moderate-regex-email",
    title: "Gmail customers",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A partner integration only supports Gmail addresses. Return every customer whose email ends with \"@gmail.com\", ignoring case.",
    clues: ['every customer whose email ends with "@gmail.com", ignoring case'],
    sql: "SELECT * FROM customers WHERE email LIKE '%@gmail.com';",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "Anchor the end of the address with `$`.",
      "Make the match case-insensitive with the `i` flag.",
      "Escape the dot: `@gmail\\.com$`.",
    ],
    referenceAnswer: "db.customers.find({ email: /@gmail\\.com$/i })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "customers" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { email: rx("@gmail\\.com$", "i") },
          variants: [
            { email: { $regex: rx("@gmail\\.com$", "i") } },
            { email: { $regex: "@gmail\\.com$", $options: "i" } },
          ],
        },
      },
    ],
  },
  {
    id: "moderate-inc-push",
    title: "Bump an order and tag it",
    difficulty: "moderate",
    operation: "update",
    statement:
      "The order with _id ObjectId(\"66f1a2b3c4d5e6f7a8b9c0d9\") gained a 5 fee. Increase its total by 5 and append \"priority\" to its tags.",
    clues: ['Increase its total by 5 and append "priority" to its tags'],
    sql: "UPDATE orders SET total = total + 5, tags = array_append(tags, 'priority') WHERE _id = '66f1a2b3c4d5e6f7a8b9c0d9';",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "`$inc` increments a numeric field by the given amount.",
      "`$push` appends a value to an array field.",
      "Both operators can live in the same update document.",
    ],
    referenceAnswer:
      'db.orders.updateOne({ _id: ObjectId("66f1a2b3c4d5e6f7a8b9c0d9") }, { $inc: { total: 5 }, $push: { tags: "priority" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "orders" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { _id: objectId("66f1a2b3c4d5e6f7a8b9c0d9") } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $inc: { total: 5 }, $push: { tags: "priority" } } },
      },
    ],
  },
  {
    id: "moderate-update-many-tier",
    title: "Promote trial accounts",
    difficulty: "moderate",
    operation: "update",
    statement:
      "Every account still on the trial tier should move to basic. Update all of them in one operation.",
    clues: ["Every account still on the trial tier should move to basic", "Update all of them in one operation"],
    sql: "UPDATE customers SET tier = 'basic' WHERE tier = 'trial';",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "Use `updateMany` when several documents should change.",
      'Filter on `{ tier: "trial" }`.',
      "Set the new tier with `$set`.",
    ],
    referenceAnswer: 'db.customers.updateMany({ tier: "trial" }, { $set: { tier: "basic" } })',
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
        expectation: { kind: "method", method: "updateMany" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { tier: "trial" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { tier: "basic" } } },
      },
    ],
  },
  {
    id: "moderate-task-projection",
    title: "Low stock shortlist",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Find products whose stock is not greater than 10, and show only the name and stock of each one.",
    clues: ["products whose stock is not greater than 10", "only the name and stock of each one"],
    sql: "SELECT name, stock FROM products WHERE stock <= 10;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "\"Not greater than\" means less than or equal to: `$lte`.",
      "Add a projection as the second argument.",
      "Include `name` and `stock` with `1`.",
    ],
    referenceAnswer: "db.products.find({ stock: { $lte: 10 } }, { name: 1, stock: 1 })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { stock: { $lte: 10 } } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: { kind: "projection", doc: { name: 1, stock: 1 } },
      },
    ],
  },
  {
    id: "moderate-or-comparison-projection",
    title: "Cheap or beloved",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A promo feed shows products that are either very cheap or very well loved. Return name and price for products priced under 10 or rated above 4.8.",
    clues: ["either very cheap or very well loved", "for products priced under 10 or rated above 4.8"],
    sql: "SELECT name, price FROM products WHERE price < 10 OR rating > 4.8;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Use `$or` with an array of two clause documents.",
      "Combine a `$lt` on price with a `$gt` on rating.",
      "Project `{ name: 1, price: 1 }` as the second argument.",
    ],
    referenceAnswer:
      "db.products.find({ $or: [{ price: { $lt: 10 } }, { rating: { $gt: 4.8 } }] }, { name: 1, price: 1 })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "products" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { $or: [{ price: { $lt: 10 } }, { rating: { $gt: 4.8 } }] },
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
    id: "moderate-employee-rewards-shortlist",
    title: "Senior engineering payroll",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A total-rewards analyst is preparing a pay review for the engineering team. Return the name, department and salary of every employee who is still active, sits in engineering and earns 120000 or more.",
    clues: [
      "every employee who is still active, sits in engineering and earns 120000 or more",
      "the name, department and salary of every employee",
    ],
    sql: "SELECT name, department, salary FROM employees WHERE active = TRUE AND department = 'engineering' AND salary >= 120000;",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "Three top-level keys in the filter are combined with an implicit AND.",
      '"Still active" is the boolean field `active: true`.',
      "Combine `$gte` on `salary` with a projection as the second argument.",
    ],
    referenceAnswer:
      'db.employees.find({ active: true, department: "engineering", salary: { $gte: 120000 } }, { name: 1, department: 1, salary: 1 })',
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
        expectation: {
          kind: "filter",
          doc: { active: true, department: "engineering", salary: { $gte: 120000 } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, department: 1, salary: 1 },
          variants: [{ name: 1, department: 1, salary: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-employee-remote-or-department",
    title: "Remote staff or revenue team",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A remote-first rollout needs everyone who already works remotely, plus everyone in the sales department. Return the name, department and remote flag of every match.",
    clues: [
      "everyone who already works remotely, plus everyone in the sales department",
      "the name, department and remote flag of every match",
    ],
    sql: "SELECT name, department, remote FROM employees WHERE remote = TRUE OR department = 'sales';",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "Two alternatives belong in `$or` as an array of two clauses.",
      "The first clause is an equality on the boolean field `remote`.",
      "The second clause is an equality on `department`.",
    ],
    referenceAnswer:
      'db.employees.find({ $or: [{ remote: true }, { department: "sales" }] }, { name: 1, department: 1, remote: 1 })',
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
        expectation: {
          kind: "filter",
          doc: { $or: [{ remote: true }, { department: "sales" }] },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, department: 1, remote: 1 },
          variants: [{ name: 1, department: 1, remote: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-employee-skills-regex",
    title: "Engineers with leadership skills",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A skills matrix is being rebuilt and needs every engineer whose skills list mentions leadership. Return those employees.",
    clues: ["every engineer whose skills list mentions leadership"],
    sql: "SELECT * FROM employees WHERE department = 'engineering' AND skills LIKE '%leadership%';",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "`skills` is an array, so the pattern may match any element.",
      "Add a `department` equality alongside the pattern match.",
      "The pattern `leadership` needs no anchors.",
    ],
    referenceAnswer: 'db.employees.find({ department: "engineering", skills: /leadership/ })',
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
        expectation: {
          kind: "filter",
          doc: { department: "engineering", skills: rx("leadership") },
          variants: [
            { department: "engineering", skills: { $regex: "leadership" } },
            { department: "engineering", skills: { $regex: rx("leadership") } },
          ],
        },
      },
    ],
  },
  {
    id: "moderate-employee-promotion",
    title: "Promote an account executive",
    difficulty: "moderate",
    operation: "update",
    statement:
      "Tomas Nilsen has been promoted. Update his record so his salary is set to 85000 and his bonus goes up by 5000.",
    clues: ["his salary is set to 85000 and his bonus goes up by 5000"],
    sql: "UPDATE employees SET salary = 85000, bonus = bonus + 5000 WHERE name = 'Tomas Nilsen';",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "An absolute value goes in `$set`; a relative change goes in `$inc`.",
      "Filter on `{ name: \"Tomas Nilsen\" }`.",
      "Both operators can share one update document.",
    ],
    referenceAnswer:
      'db.employees.updateOne({ name: "Tomas Nilsen" }, { $set: { salary: 85000 }, $inc: { bonus: 5000 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "employees" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { name: "Tomas Nilsen" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { salary: 85000 }, $inc: { bonus: 5000 } } },
      },
    ],
  },
  {
    id: "moderate-review-unverified-low-rating",
    title: "Unverified one-to-three star feedback",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Quality is auditing the worst feedback. Return the productId, rating and verified flag of every review that gave 3 stars or fewer and is not from a verified purchase.",
    clues: [
      "every review that gave 3 stars or fewer and is not from a verified purchase",
      "the productId, rating and verified flag of every review",
    ],
    sql: "SELECT productId, rating, verified FROM reviews WHERE rating <= 3 AND verified = FALSE;",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      "Two top-level keys are combined with an implicit AND.",
      '"Not from a verified purchase" is the boolean `verified: false`.',
      '"3 stars or fewer" means `$lte` on `rating`.',
    ],
    referenceAnswer:
      "db.reviews.find({ rating: { $lte: 3 }, verified: false }, { productId: 1, rating: 1, verified: 1 })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "reviews" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { rating: { $lte: 3 }, verified: false } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { productId: 1, rating: 1, verified: 1 },
          variants: [{ productId: 1, rating: 1, verified: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-review-verified-product-set",
    title: "Publishable reviews for three products",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Only verified feedback for a shortlist of products is publishable. Return the productId, customer and rating of every verified review of P-100, P-102 and P-103.",
    clues: [
      "every verified review of P-100, P-102 and P-103",
      "the productId, customer and rating",
    ],
    sql: "SELECT productId, customer, rating FROM reviews WHERE verified = TRUE AND productId IN ('P-100','P-102','P-103');",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      "A list of allowed values is matched with `$in`.",
      "Combine `verified: true` with the product list.",
      "Project `{ productId: 1, customer: 1, rating: 1 }` as the second argument.",
    ],
    referenceAnswer:
      'db.reviews.find({ verified: true, productId: { $in: ["P-100", "P-102", "P-103"] } }, { productId: 1, customer: 1, rating: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "reviews" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { verified: true, productId: { $in: ["P-100", "P-102", "P-103"] } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { productId: 1, customer: 1, rating: 1 },
          variants: [{ productId: 1, customer: 1, rating: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-review-customer-regex",
    title: "Reviewers outside the gmail cohort",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A spam sweep looks for every review whose customer address contains @example.com. Return the customer and rating of each hit.",
    clues: [
      "every review whose customer address contains @example.com",
      "the customer and rating of each hit",
    ],
    sql: "SELECT customer, rating FROM reviews WHERE customer LIKE '%@example.com%';",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      "A partial string match is a regular expression with no anchors.",
      "Escape the literal dot so it is not a wildcard.",
      "Project `{ customer: 1, rating: 1 }` as the second argument.",
    ],
    referenceAnswer: "db.reviews.find({ customer: /@example\\.com/ }, { customer: 1, rating: 1 })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "reviews" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { customer: rx("@example\\.com") },
          variants: [
            { customer: { $regex: rx("@example\\.com") } },
            { customer: { $regex: "@example.com" } },
          ],
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { customer: 1, rating: 1 },
          variants: [{ customer: 1, rating: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-ticket-urgent-queue",
    title: "The urgent open queue",
    difficulty: "moderate",
    operation: "find",
    statement:
      "The duty manager only wants the urgent queue. Return the subject, status and assignee of every ticket that is still open with an urgent priority.",
    clues: [
      "every ticket that is still open with an urgent priority",
      "the subject, status and assignee",
    ],
    sql: "SELECT subject, status, assignee FROM tickets WHERE status = 'open' AND priority = 'urgent';",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "Two equalities on different fields are combined with an implicit AND.",
      "Filter on both `status` and `priority`.",
      "Project `{ subject: 1, status: 1, assignee: 1 }` as the second argument.",
    ],
    referenceAnswer:
      'db.tickets.find({ status: "open", priority: "urgent" }, { subject: 1, status: 1, assignee: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "tickets" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { status: "open", priority: "urgent" } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { subject: 1, status: 1, assignee: 1 },
          variants: [{ subject: 1, status: 1, assignee: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-ticket-channel-in-nin",
    title: "Email and phone backlog",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A backlog review covers tickets that came in by email or phone, leaving out anything already closed. Return the _id, subject and channel of every match.",
    clues: [
      "tickets that came in by email or phone, leaving out anything already closed",
      "the _id, subject and channel of every match",
    ],
    sql: "SELECT _id, subject, channel FROM tickets WHERE channel IN ('email','phone') AND status NOT IN ('closed');",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "`$in` matches any value in a list; `$nin` excludes a list of values.",
      "Use `{ $in: [\"email\", \"phone\"] }` on `channel`.",
      "Use `{ $nin: [\"closed\"] }` to skip finished work.",
    ],
    referenceAnswer:
      'db.tickets.find({ channel: { $in: ["email", "phone"] }, status: { $nin: ["closed"] } }, { _id: 1, subject: 1, channel: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "tickets" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { channel: { $in: ["email", "phone"] }, status: { $nin: ["closed"] } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { _id: 1, subject: 1, channel: 1 },
        },
      },
    ],
  },
  {
    id: "moderate-ticket-unowned-or-chat",
    title: "Unowned or chat-borne tickets",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Support leadership wants the unowned backlog. Return the subject, channel and assignee of every ticket that either has no assignee yet or came in by chat.",
    clues: [
      "every ticket that either has no assignee yet or came in by chat",
      "the subject, channel and assignee",
    ],
    sql: "SELECT subject, channel, assignee FROM tickets WHERE assignee IS NULL OR channel = 'chat';",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "Two alternatives go into `$or` as an array of two clauses.",
      '"No assignee yet" is the null value `null`.',
      "The second clause is an equality on `channel`.",
    ],
    referenceAnswer:
      'db.tickets.find({ $or: [{ assignee: null }, { channel: "chat" }] }, { subject: 1, channel: 1, assignee: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "tickets" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { $or: [{ assignee: null }, { channel: "chat" }] },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { subject: 1, channel: 1, assignee: 1 },
          variants: [{ subject: 1, channel: 1, assignee: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-ticket-push-escalated-tag",
    title: "Tag a ticket as escalated",
    difficulty: "moderate",
    operation: "update",
    statement:
      "The webhook retries ticket has been escalated. For the ticket that is still pending with a medium priority, add the tag escalated to its tags.",
    clues: [
      "the ticket that is still pending with a medium priority",
      "add the tag escalated to its tags",
    ],
    sql: "UPDATE tickets SET tags = array_append(tags, 'escalated') WHERE status = 'pending' AND priority = 'medium';",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "`$push` appends one value to an array field.",
      "Filter on `{ status: \"pending\", priority: \"medium\" }`.",
      "The pushed value goes inside the `$push` document.",
    ],
    referenceAnswer:
      'db.tickets.updateOne({ status: "pending", priority: "medium" }, { $push: { tags: "escalated" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "tickets" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { status: "pending", priority: "medium" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $push: { tags: "escalated" } } },
      },
    ],
  },
  {
    id: "moderate-ticket-update-many-priority",
    title: "Escalate the unowned queue",
    difficulty: "moderate",
    operation: "update",
    statement:
      "Support has decided that every open ticket nobody has picked up yet should be escalated. Set their priority to high and update them all in a single operation.",
    clues: [
      "every open ticket nobody has picked up yet",
      "Set their priority to high and update them all in a single operation",
    ],
    sql: "UPDATE tickets SET priority = 'high' WHERE status = 'open' AND assignee IS NULL;",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "Use `updateMany` so every matching ticket changes together.",
      "Combine `status: \"open\"` with `assignee: null`.",
      "The new priority goes inside `$set`.",
    ],
    referenceAnswer:
      'db.tickets.updateMany({ status: "open", assignee: null }, { $set: { priority: "high" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "tickets" },
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
        expectation: { kind: "filter", doc: { status: "open", assignee: null } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { priority: "high" } } },
      },
    ],
  },
  {
    id: "moderate-session-abandoned-web",
    title: "Abandoned web sessions",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Product analytics wants the web sessions that never finished. Return the userId, device, durationMins and pagesViewed of every visit that ran on the web and was not completed.",
    clues: [
      "every visit that ran on the web and was not completed",
      "the userId, device, durationMins and pagesViewed",
    ],
    sql: "SELECT userId, device, durationMins, pagesViewed FROM sessions WHERE device = 'web' AND completed = FALSE;",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "Two top-level keys are combined with an implicit AND.",
      '"Not completed" is the boolean `completed: false`.',
      "Project the four requested fields as the second argument.",
    ],
    referenceAnswer:
      "db.sessions.find({ device: \"web\", completed: false }, { userId: 1, device: 1, durationMins: 1, pagesViewed: 1 })",
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "sessions" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { device: "web", completed: false } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { userId: 1, device: 1, durationMins: 1, pagesViewed: 1 },
          variants: [
            { userId: 1, device: 1, durationMins: 1, pagesViewed: 1, _id: 0 },
          ],
        },
      },
    ],
  },
  {
    id: "moderate-session-mobile-duration",
    title: "Long mobile sessions",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Retention analysis wants the meaningful visits. Return the userId, device and durationMins of every session on iOS or Android that lasted at least 30 minutes.",
    clues: [
      "every session on iOS or Android that lasted at least 30 minutes",
      "the userId, device and durationMins",
    ],
    sql: "SELECT userId, device, durationMins FROM sessions WHERE device IN ('ios','android') AND durationMins >= 30;",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "Two allowed devices are matched with `$in`.",
      '"At least 30 minutes" is `$gte` on `durationMins`.',
      "Project `{ userId: 1, device: 1, durationMins: 1 }` as the second argument.",
    ],
    referenceAnswer:
      'db.sessions.find({ device: { $in: ["ios", "android"] }, durationMins: { $gte: 30 } }, { userId: 1, device: 1, durationMins: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "sessions" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { device: { $in: ["ios", "android"] }, durationMins: { $gte: 30 } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { userId: 1, device: 1, durationMins: 1 },
          variants: [{ userId: 1, device: 1, durationMins: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-session-increment-pageview",
    title: "Credit an extra page view",
    difficulty: "moderate",
    operation: "update",
    statement:
      "Tracking over-counted by one on the visit that started at 2026-05-03T19:30:00Z. Add 1 to the pagesViewed of that session.",
    clues: [
      "the visit that started at 2026-05-03T19:30:00Z",
      "Add 1 to the pagesViewed of that session",
    ],
    sql: "UPDATE sessions SET pagesViewed = pagesViewed + 1 WHERE startedAt = '2026-05-03T19:30:00Z';",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "Only one document should change, so use `updateOne`.",
      "Filter on the exact `startedAt` timestamp string.",
      "A relative numeric change is `$inc`.",
    ],
    referenceAnswer:
      'db.sessions.updateOne({ startedAt: "2026-05-03T19:30:00Z" }, { $inc: { pagesViewed: 1 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        weight: 10,
        expectation: { kind: "collection", name: "sessions" },
      },
      { id: "method", label: "Method", weight: 20, expectation: { kind: "method", method: "updateOne" } },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { startedAt: "2026-05-03T19:30:00Z" } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $inc: { pagesViewed: 1 } } },
      },
    ],
  },
  {
    id: "moderate-invoice-settled-eur",
    title: "Settled euro invoices",
    difficulty: "moderate",
    operation: "find",
    statement:
      "Finance reconciles settled invoices only, and only in euro. Return the customerId, amount and status of every invoice that is already paid and denominated in EUR.",
    clues: [
      "every invoice that is already paid and denominated in EUR",
      "the customerId, amount and status",
    ],
    sql: "SELECT customerId, amount, status FROM invoices WHERE status = 'paid' AND currency = 'EUR';",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Two equalities on different fields are combined with an implicit AND.",
      "Filter on `status` and on `currency`.",
      "Project `{ customerId: 1, amount: 1, status: 1 }` as the second argument.",
    ],
    referenceAnswer:
      'db.invoices.find({ status: "paid", currency: "EUR" }, { customerId: 1, amount: 1, status: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "invoices" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { status: "paid", currency: "EUR" } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { customerId: 1, amount: 1, status: 1 },
          variants: [{ customerId: 1, amount: 1, status: 1, _id: 0 }],
        },
      },
    ],
  },
  {
    id: "moderate-invoice-high-debt-status-in",
    title: "High-value unsettled invoices",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A collections agency chases high-value debts. Return the _id, amount and status of invoices that are either unpaid or overdue, keeping only those above 1000.",
    clues: [
      "invoices that are either unpaid or overdue",
      "keeping only those above 1000",
      "the _id, amount and status",
    ],
    sql: "SELECT _id, amount, status FROM invoices WHERE status IN ('unpaid','overdue') AND amount > 1000;",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "`$in` matches a value against a list of allowed statuses.",
      "Combine the status list with a `$gt` on `amount`.",
      "Project `{ _id: 1, amount: 1, status: 1 }` as the second argument.",
    ],
    referenceAnswer:
      'db.invoices.find({ status: { $in: ["unpaid", "overdue"] }, amount: { $gt: 1000 } }, { _id: 1, amount: 1, status: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "invoices" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { status: { $in: ["unpaid", "overdue"] }, amount: { $gt: 1000 } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { _id: 1, amount: 1, status: 1 },
        },
      },
    ],
  },
  {
    id: "moderate-invoice-mark-overdue",
    title: "Flag overdue invoices",
    difficulty: "moderate",
    operation: "update",
    statement:
      "Every unpaid invoice worth more than 400 has now missed its deadline. Mark all of them as overdue in a single operation.",
    clues: ["Every unpaid invoice worth more than 400", "Mark all of them as overdue in a single operation"],
    sql: "UPDATE invoices SET status = 'overdue' WHERE status = 'unpaid' AND amount > 400;",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Use `updateMany` so every matching invoice changes together.",
      "Combine `status: \"unpaid\"` with a `$gt` on `amount`.",
      "The new status goes inside `$set`.",
    ],
    referenceAnswer:
      'db.invoices.updateMany({ status: "unpaid", amount: { $gt: 400 } }, { $set: { status: "overdue" } })',
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
        weight: 20,
        expectation: { kind: "method", method: "updateMany" },
      },
      {
        id: "filter",
        label: "Filter condition",
        weight: 30,
        expectation: { kind: "filter", doc: { status: "unpaid", amount: { $gt: 400 } } },
      },
      {
        id: "update",
        label: "Update document",
        weight: 40,
        expectation: { kind: "update", doc: { $set: { status: "overdue" } } },
      },
    ],
  },
  {
    id: "moderate-order-pending-over-100",
    title: "Big orders awaiting fulfilment",
    difficulty: "moderate",
    operation: "find",
    statement:
      "The fulfilment lead wants the valuable backlog. Return the _id, customerId and total of every order that is still pending with a total above 100.",
    clues: [
      "every order that is still pending with a total above 100",
      "the _id, customerId and total",
    ],
    sql: "SELECT _id, customerId, total FROM orders WHERE status = 'pending' AND total > 100;",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "Two top-level keys are combined with an implicit AND.",
      '"Above 100" is `$gt` on `total`.',
      "Project `{ _id: 1, customerId: 1, total: 1 }` as the second argument.",
    ],
    referenceAnswer:
      'db.orders.find({ status: "pending", total: { $gt: 100 } }, { _id: 1, customerId: 1, total: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "orders" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { status: "pending", total: { $gt: 100 } } },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { _id: 1, customerId: 1, total: 1 },
        },
      },
    ],
  },
  {
    id: "moderate-customer-loyalty-cities",
    title: "Loyalty campaign shortlist",
    difficulty: "moderate",
    operation: "find",
    statement:
      "A loyalty campaign targets our strongest members in two cities. Return the name, tier and city of every customer who is on the gold or pro tier and lives in either London or Berlin.",
    clues: [
      "every customer who is on the gold or pro tier and lives in either London or Berlin",
      "the name, tier and city",
    ],
    sql: "SELECT name, tier, city FROM customers WHERE tier IN ('gold','pro') AND city IN ('London','Berlin');",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "Each of the two allowed-value lists is matched with `$in`.",
      "Combine the tier list and the city list at the top level.",
      "Project `{ name: 1, tier: 1, city: 1 }` as the second argument.",
    ],
    referenceAnswer:
      'db.customers.find({ tier: { $in: ["gold", "pro"] }, city: { $in: ["London", "Berlin"] } }, { name: 1, tier: 1, city: 1 })',
    rubric: [
      { id: "collection", label: "Collection", expectation: { kind: "collection", name: "customers" } },
      { id: "method", label: "Method", expectation: { kind: "method", method: "find" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { tier: { $in: ["gold", "pro"] }, city: { $in: ["London", "Berlin"] } },
        },
      },
      {
        id: "projection",
        label: "Projection",
        expectation: {
          kind: "projection",
          doc: { name: 1, tier: 1, city: 1 },
          variants: [{ name: 1, tier: 1, city: 1, _id: 0 }],
        },
      },
    ],
  },
];
