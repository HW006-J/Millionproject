import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import {
  claimWebhookEvent,
  markWebhookEventFailed,
  markWebhookEventProcessed,
} from "@/lib/webhooks/claimWebhookEvent";

const { mockCreate, mockUpdateMany, mockFindUnique, mockUpdate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    webhookEvent: {
      create: mockCreate,
      updateMany: mockUpdateMany,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

function uniqueConstraintError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target: ["providerEventId"] },
  });
}

beforeEach(() => {
  mockCreate.mockReset();
  mockUpdateMany.mockReset();
  mockFindUnique.mockReset();
  mockUpdate.mockReset();
});

describe("claimWebhookEvent", () => {
  it("claims a brand-new event via the unique constraint", async () => {
    mockCreate.mockResolvedValue({});

    const result = await claimWebhookEvent("stripe", "evt_1", "checkout.session.completed");

    expect(result).toBe("claimed");
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("skips an event that was already fully processed (duplicate delivery)", async () => {
    mockCreate.mockRejectedValue(uniqueConstraintError());
    mockUpdateMany.mockResolvedValue({ count: 0 });
    mockFindUnique.mockResolvedValue({ processed: true });

    const result = await claimWebhookEvent("stripe", "evt_1", "checkout.session.completed");

    expect(result).toBe("already_processed");
  });

  it("reports in_progress when a concurrent delivery is currently being claimed", async () => {
    mockCreate.mockRejectedValue(uniqueConstraintError());
    mockUpdateMany.mockResolvedValue({ count: 0 });
    mockFindUnique.mockResolvedValue({ processed: false });

    const result = await claimWebhookEvent("stripe", "evt_1", "checkout.session.completed");

    expect(result).toBe("in_progress");
  });

  it("allows reclaiming a previously stale/failed (unprocessed) event for retry", async () => {
    mockCreate.mockRejectedValue(uniqueConstraintError());
    mockUpdateMany.mockResolvedValue({ count: 1 });

    const result = await claimWebhookEvent("stripe", "evt_1", "checkout.session.completed");

    expect(result).toBe("claimed");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("rethrows unrelated database errors from the initial create", async () => {
    mockCreate.mockRejectedValue(new Error("connection lost"));

    await expect(
      claimWebhookEvent("stripe", "evt_1", "checkout.session.completed"),
    ).rejects.toThrow("connection lost");
  });
});

describe("markWebhookEventProcessed / markWebhookEventFailed", () => {
  it("marks an event processed", async () => {
    mockUpdate.mockResolvedValue({});
    await markWebhookEventProcessed("evt_1");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { providerEventId: "evt_1" },
      data: { processed: true, processedAt: expect.any(Date) },
    });
  });

  it("records a truncated failure reason", async () => {
    mockUpdate.mockResolvedValue({});
    await markWebhookEventFailed("evt_1", "x".repeat(600));
    const data = mockUpdate.mock.calls[0][0].data;
    expect(data.failureReason).toHaveLength(500);
  });
});
