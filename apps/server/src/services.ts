import { createPrismaClient } from "@mongo/db";

import { ENV } from "./env.server";

export const db = createPrismaClient(ENV);
