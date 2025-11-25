"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { selfInvestments } from "../db/schema";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { z } from "zod";

const createSelfInvestmentSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(["course", "certification", "book", "tool", "coaching", "other"]),
  amountInvested: z.number().min(0),
  roi: z.number().optional(),
  outcome: z.enum(["paid_off", "didnt_pay_off", "in_progress", "too_early"]),
  description: z.string().min(10).max(2000),
  investmentDate: z.string(), // ISO date string
});

export async function createSelfInvestment(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const rawData = {
    title: formData.get("title")?.toString() || "",
    category: formData.get("category")?.toString() || "other",
    amountInvested: parseFloat(formData.get("amountInvested")?.toString() || "0"),
    roi: formData.get("roi")?.toString() ? parseFloat(formData.get("roi")!.toString()) : undefined,
    outcome: formData.get("outcome")?.toString() || "in_progress",
    description: formData.get("description")?.toString() || "",
    investmentDate: formData.get("investmentDate")?.toString() || new Date().toISOString(),
  };

  const validated = createSelfInvestmentSchema.parse(rawData);

  const investmentId = nanoid();

  await db.insert(selfInvestments).values({
    id: investmentId,
    userId,
    title: validated.title,
    category: validated.category,
    amountInvested: validated.amountInvested.toString(),
    roi: validated.roi?.toString(),
    outcome: validated.outcome,
    description: validated.description,
    investmentDate: new Date(validated.investmentDate),
  });

  revalidatePath("/self-investment");
  return { success: true, investmentId };
}

export async function getUserSelfInvestments(userId: string) {
  const investments = await db
    .select()
    .from(selfInvestments)
    .where(eq(selfInvestments.userId, userId))
    .orderBy(desc(selfInvestments.createdAt));

  return investments.map((inv) => ({
    ...inv,
    amountInvested: parseFloat(inv.amountInvested || "0"),
    roi: inv.roi ? parseFloat(inv.roi) : null,
  }));
}

export async function getAllSelfInvestments() {
  const investments = await db
    .select({
      id: selfInvestments.id,
      userId: selfInvestments.userId,
      title: selfInvestments.title,
      category: selfInvestments.category,
      amountInvested: selfInvestments.amountInvested,
      roi: selfInvestments.roi,
      outcome: selfInvestments.outcome,
      description: selfInvestments.description,
      investmentDate: selfInvestments.investmentDate,
      createdAt: selfInvestments.createdAt,
    })
    .from(selfInvestments)
    .orderBy(desc(selfInvestments.createdAt));

  return investments.map((inv) => ({
    ...inv,
    amountInvested: parseFloat(inv.amountInvested || "0"),
    roi: inv.roi ? parseFloat(inv.roi) : null,
  }));
}

export async function getTopROIs(limit: number = 10) {
  const investments = await db
    .select()
    .from(selfInvestments)
    .where(
      and(
        eq(selfInvestments.outcome, "paid_off"),
        sql`${selfInvestments.roi} IS NOT NULL`
      )
    )
    .orderBy(desc(selfInvestments.roi))
    .limit(limit);

  return investments.map((inv) => ({
    ...inv,
    amountInvested: parseFloat(inv.amountInvested || "0"),
    roi: inv.roi ? parseFloat(inv.roi) : null,
  }));
}

export async function getWorstROIs(limit: number = 10) {
  const investments = await db
    .select()
    .from(selfInvestments)
    .where(
      and(
        eq(selfInvestments.outcome, "didnt_pay_off"),
        sql`${selfInvestments.roi} IS NOT NULL`
      )
    )
    .orderBy(asc(selfInvestments.roi))
    .limit(limit);

  return investments.map((inv) => ({
    ...inv,
    amountInvested: parseFloat(inv.amountInvested || "0"),
    roi: inv.roi ? parseFloat(inv.roi) : null,
  }));
}


