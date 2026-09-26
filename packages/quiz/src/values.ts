import { MongoRegex, MongoTypedValue } from "./types.js";

/** Author a regex literal in a problem expectation. */
export function rx(pattern: string, flags = ""): MongoRegex {
  return new MongoRegex(pattern, flags);
}

/** Author an `ObjectId("...")` value in a problem expectation. */
export function objectId(id: string): MongoTypedValue {
  return new MongoTypedValue("ObjectId", id);
}

/** Author an `ISODate("...")` value in a problem expectation. */
export function isoDate(value: string): MongoTypedValue {
  return new MongoTypedValue("ISODate", value);
}
