import type { Problem } from "../types.js";
import { rx } from "../values.js";
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
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
    id: "moderate-tag-practice-products",
    title: "Tag the practice products",
    difficulty: "moderate",
    operation: "update",
    statement:
      'Merchandising is archiving the practice products, so every product whose tags mention "practice" has to gain the tag "archive".',
    clues: ['every product whose tags mention "practice"', 'has to gain the tag "archive"'],
    sql: "UPDATE products SET tags = 'archive' WHERE tags LIKE '%practice%';",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Several products match, so the update applies through `updateMany`.",
      "The filter still needs the regular expression, because `tags` is an array of strings.",
      'Inside the update, `$addToSet` appends "archive" only where it is missing.',
    ],
    referenceAnswer:
      'db.products.updateMany({ tags: /practice/ }, { $addToSet: { tags: "archive" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { tags: rx("practice") },
          variants: [{ tags: { $regex: "practice" } }, { tags: { $regex: rx("practice") } }],
        },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $addToSet: { tags: "archive" } } },
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
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
      'A partner integration only supports Gmail addresses. Return every customer whose email ends with "@gmail.com", ignoring case.',
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "customers" },
      },
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
      "The order with _id 101 gained a 5 fee. Increase its total by 5 and append \"priority\" to its tags.",
    clues: ['Increase its total by 5 and append "priority" to its tags'],
    sql: "UPDATE orders SET total = total + 5, tags = array_append(tags, 'priority') WHERE _id = 101;",
    collection: "orders",
    sampleDocuments: ORDERS,
    hints: [
      "`$inc` increments a numeric field by the given amount.",
      "`$push` appends a value to an array field.",
      "Both operators can live in the same update document.",
    ],
    referenceAnswer:
      'db.orders.updateOne({ _id: 101 }, { $inc: { total: 5 }, $push: { tags: "priority" } })',
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
        expectation: { kind: "filter", doc: { _id: 101 } },
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
    clues: [
      "Every account still on the trial tier should move to basic",
      "Update all of them in one operation",
    ],
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
    id: "moderate-clear-low-stock-flags",
    title: "Clear the low stock flags",
    difficulty: "moderate",
    operation: "update",
    statement:
      "The clearance project finished, so the lowStock marker has to be dropped from every product whose stock is not greater than 10.",
    clues: ["the lowStock marker has to be dropped", "whose stock is not greater than 10"],
    sql: "UPDATE products SET lowStock = NULL WHERE stock <= 10;",
    collection: "products",
    sampleDocuments: PRODUCTS,
    hints: [
      "Every low-stock product is affected, so use `updateMany`.",
      '"Not greater than" is less than or equal to, so the filter is `{ stock: { $lte: 10 } }`.',
      "`$unset` removes the field entirely; its operand is just an empty string.",
    ],
    referenceAnswer:
      'db.products.updateMany({ stock: { $lte: 10 } }, { $unset: { lowStock: "" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { stock: { $lte: 10 } } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $unset: { lowStock: "" } } },
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
    clues: [
      "either very cheap or very well loved",
      "for products priced under 10 or rated above 4.8",
    ],
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "products" },
      },
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
    id: "moderate-drop-leadership-skill",
    title: "Retire the leadership skill",
    difficulty: "moderate",
    operation: "update",
    statement:
      "The skills matrix was rebuilt without the leadership entry, so leadership has to be pulled from the skills list of every engineer whose skills list mentions leadership.",
    clues: [
      "leadership has to be pulled from the skills list",
      "of every engineer whose skills list mentions leadership",
    ],
    sql: "UPDATE employees SET skills = skills - 'leadership' WHERE department = 'engineering' AND skills LIKE '%leadership%';",
    collection: "employees",
    sampleDocuments: EMPLOYEES,
    hints: [
      "More than one engineer can match, so use `updateMany`.",
      "`$pull` removes a value from an array field wherever it appears in that array.",
      'Inside the update, `{ $pull: { skills: "leadership" } }` takes the entry back out.',
    ],
    referenceAnswer:
      'db.employees.updateMany({ department: "engineering", skills: /leadership/ }, { $pull: { skills: "leadership" } })',
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
        expectation: {
          kind: "filter",
          doc: { department: "engineering", skills: rx("leadership") },
          variants: [
            { department: "engineering", skills: { $regex: "leadership" } },
            { department: "engineering", skills: { $regex: rx("leadership") } },
          ],
        },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $pull: { skills: "leadership" } } },
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
      'Filter on `{ name: "Tomas Nilsen" }`.',
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "reviews" },
      },
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
    id: "moderate-flag-shortlist-reviews",
    title: "Flag reviews on the shortlist",
    difficulty: "moderate",
    operation: "update",
    statement:
      "The shortlist is under legal review, so the flag shortlistReview has to be set on every verified review of P-100, P-102 and P-103.",
    clues: [
      "the flag shortlistReview has to be set",
      "every verified review of P-100, P-102 and P-103",
    ],
    sql: "UPDATE reviews SET shortlistReview = 1 WHERE verified = TRUE AND productId IN ('P-100','P-102','P-103');",
    collection: "reviews",
    sampleDocuments: REVIEWS,
    hints: [
      "Several reviews can match, so use `updateMany`.",
      "A list of allowed values is matched with `$in`.",
      "Combine `verified: true` with the product list in the filter, then write the flag with `$set`.",
    ],
    referenceAnswer:
      'db.reviews.updateMany({ verified: true, productId: { $in: ["P-100", "P-102", "P-103"] } }, { $set: { shortlistReview: true } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "reviews" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { verified: true, productId: { $in: ["P-100", "P-102", "P-103"] } },
        },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $set: { shortlistReview: true } } },
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "reviews" },
      },
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
    id: "moderate-page-duty-manager",
    title: "Page the duty manager",
    difficulty: "moderate",
    operation: "update",
    statement:
      "The duty manager was paged, so the assignee of every ticket that is still open with an urgent priority has to become the address on-call@helpdesk.com.",
    clues: [
      "every ticket that is still open with an urgent priority",
      "has to become the address on-call@helpdesk.com",
    ],
    sql: "UPDATE tickets SET assignee = 'on-call@helpdesk.com' WHERE status = 'open' AND priority = 'urgent';",
    collection: "tickets",
    sampleDocuments: TICKETS,
    hints: [
      "Several tickets can match, so use `updateMany`.",
      "Two equalities on different fields are combined with an implicit AND.",
      'Write the new address with `$set`, so `{ $set: { assignee: "on-call@helpdesk.com" } }`.',
    ],
    referenceAnswer:
      'db.tickets.updateMany({ status: "open", priority: "urgent" }, { $set: { assignee: "on-call@helpdesk.com" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "tickets" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { status: "open", priority: "urgent" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $set: { assignee: "on-call@helpdesk.com" } } },
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
      'Use `{ $in: ["email", "phone"] }` on `channel`.',
      'Use `{ $nin: ["closed"] }` to skip finished work.',
    ],
    referenceAnswer:
      'db.tickets.find({ channel: { $in: ["email", "phone"] }, status: { $nin: ["closed"] } }, { _id: 1, subject: 1, channel: 1 })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "tickets" },
      },
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "tickets" },
      },
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
      'Filter on `{ status: "pending", priority: "medium" }`.',
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
      'Combine `status: "open"` with `assignee: null`.',
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
    id: "moderate-clear-abandoned-referrer",
    title: "Clear the referrer on abandoned web visits",
    difficulty: "moderate",
    operation: "update",
    statement:
      "Privacy review is done, so the referrer field has to be removed from every visit that ran on the web and was not completed.",
    clues: [
      "the referrer field has to be removed",
      "every visit that ran on the web and was not completed",
    ],
    sql: "UPDATE sessions SET referrer = NULL WHERE device = 'web' AND completed = FALSE;",
    collection: "sessions",
    sampleDocuments: SESSIONS,
    hints: [
      "More than one visit can match, so use `updateMany`.",
      "Two top-level keys are combined with an implicit AND.",
      "`$unset` removes the field entirely; its operand is just an empty string.",
    ],
    referenceAnswer:
      'db.sessions.updateMany({ device: "web", completed: false }, { $unset: { referrer: "" } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "sessions" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: { kind: "filter", doc: { device: "web", completed: false } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $unset: { referrer: "" } } },
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "sessions" },
      },
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
    id: "moderate-stamp-settled-invoices",
    title: "Stamp the settlement date",
    difficulty: "moderate",
    operation: "update",
    statement:
      "Every invoice that is already paid and denominated in EUR has to be stamped with the moment it was settled, recorded in a settledAt field as the current date and time.",
    clues: [
      "Every invoice that is already paid and denominated in EUR",
      "recorded in a settledAt field as the current date and time",
    ],
    sql: "UPDATE invoices SET settledAt = CURRENT_TIMESTAMP WHERE status = 'paid' AND currency = 'EUR';",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Several invoices are settled, so use `updateMany`.",
      "Two equalities on different fields are combined with an implicit AND.",
      "`$currentDate` writes the server's current date and time, so the operand is `true`.",
    ],
    referenceAnswer:
      'db.invoices.updateMany({ status: "paid", currency: "EUR" }, { $currentDate: { settledAt: true } })',
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
        expectation: { kind: "filter", doc: { status: "paid", currency: "EUR" } },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $currentDate: { settledAt: true } } },
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "invoices" },
      },
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
    clues: [
      "Every unpaid invoice worth more than 400",
      "Mark all of them as overdue in a single operation",
    ],
    sql: "UPDATE invoices SET status = 'overdue' WHERE status = 'unpaid' AND amount > 400;",
    collection: "invoices",
    sampleDocuments: INVOICES,
    hints: [
      "Use `updateMany` so every matching invoice changes together.",
      'Combine `status: "unpaid"` with a `$gt` on `amount`.',
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
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "orders" },
      },
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
    id: "moderate-double-loyalty-points",
    title: "Double loyalty points for the campaign",
    difficulty: "moderate",
    operation: "update",
    statement:
      "The loyalty campaign doubles the points of every customer who is on the gold or pro tier and lives in either London or Berlin.",
    clues: [
      "doubles the points of every customer who is on the gold or pro tier",
      "and lives in either London or Berlin",
    ],
    sql: "UPDATE customers SET loyaltyPoints = loyaltyPoints * 2 WHERE tier IN ('gold','pro') AND city IN ('London','Berlin');",
    collection: "customers",
    sampleDocuments: CUSTOMERS,
    hints: [
      "More than one customer can match, so use `updateMany`.",
      "Each of the two allowed-value lists is matched with `$in`, combined at the top level.",
      "`$mul` multiplies the current value, so doubling points is `{ $mul: { loyaltyPoints: 2 } }`.",
    ],
    referenceAnswer:
      'db.customers.updateMany({ tier: { $in: ["gold", "pro"] }, city: { $in: ["London", "Berlin"] } }, { $mul: { loyaltyPoints: 2 } })',
    rubric: [
      {
        id: "collection",
        label: "Collection",
        expectation: { kind: "collection", name: "customers" },
      },
      { id: "method", label: "Method", expectation: { kind: "method", method: "updateMany" } },
      {
        id: "filter",
        label: "Filter condition",
        expectation: {
          kind: "filter",
          doc: { tier: { $in: ["gold", "pro"] }, city: { $in: ["London", "Berlin"] } },
        },
      },
      {
        id: "update",
        label: "Update document",
        expectation: { kind: "update", doc: { $mul: { loyaltyPoints: 2 } } },
      },
    ],
  },
];
