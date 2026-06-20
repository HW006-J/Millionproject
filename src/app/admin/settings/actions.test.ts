import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin, mockCampaignFindUnique, mockCampaignUpdate, mockRevalidatePath } = vi.hoisted(
  () => ({
    mockRequireAdmin: vi.fn(),
    mockCampaignFindUnique: vi.fn(),
    mockCampaignUpdate: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }),
);

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: { findUnique: mockCampaignFindUnique, update: mockCampaignUpdate },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

const { toggleCampaignActiveAction, updateCampaignTargetAction } = await import(
  "@/app/admin/settings/actions"
);

function formDataWith(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockCampaignFindUnique.mockReset();
  mockCampaignUpdate.mockReset();
  mockRevalidatePath.mockReset();
  mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });
});

describe("toggleCampaignActiveAction", () => {
  it("requires server-side authorization before touching the database", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(
      toggleCampaignActiveAction({}, formDataWith({ nextActive: "false" })),
    ).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockCampaignUpdate).not.toHaveBeenCalled();
  });

  it("updates only isActive — never confirmed totals or contribution count", async () => {
    mockCampaignUpdate.mockResolvedValue({});

    await toggleCampaignActiveAction({}, formDataWith({ nextActive: "false" }));

    expect(mockCampaignUpdate).toHaveBeenCalledWith({
      where: { slug: "one-million" },
      data: { isActive: false },
    });
  });

  it("revalidates the settings, admin, and public pages", async () => {
    mockCampaignUpdate.mockResolvedValue({});

    await toggleCampaignActiveAction({}, formDataWith({ nextActive: "true" }));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/settings");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("returns a generic error for a malformed value", async () => {
    const result = await toggleCampaignActiveAction({}, formDataWith({ nextActive: "maybe" }));

    expect(result.error).toBeTruthy();
    expect(mockCampaignUpdate).not.toHaveBeenCalled();
  });
});

describe("updateCampaignTargetAction", () => {
  it("requires server-side authorization before reading the campaign", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(
      updateCampaignTargetAction({}, formDataWith({ targetDollars: "2000000" })),
    ).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockCampaignFindUnique).not.toHaveBeenCalled();
  });

  it("updates only targetAmountCents on a valid input", async () => {
    mockCampaignFindUnique.mockResolvedValue({ confirmedAmountCents: 100 });
    mockCampaignUpdate.mockResolvedValue({});

    await updateCampaignTargetAction({}, formDataWith({ targetDollars: "2000000" }));

    expect(mockCampaignUpdate).toHaveBeenCalledWith({
      where: { slug: "one-million" },
      data: { targetAmountCents: 200_000_000 },
    });
  });

  it("rejects a target below the confirmed amount without touching the database", async () => {
    mockCampaignFindUnique.mockResolvedValue({ confirmedAmountCents: 500_000 });

    const result = await updateCampaignTargetAction({}, formDataWith({ targetDollars: "100" }));

    expect(result.error).toBeTruthy();
    expect(mockCampaignUpdate).not.toHaveBeenCalled();
  });

  it("rejects malformed input without touching the database", async () => {
    mockCampaignFindUnique.mockResolvedValue({ confirmedAmountCents: 0 });

    const result = await updateCampaignTargetAction({}, formDataWith({ targetDollars: "abc" }));

    expect(result.error).toBeTruthy();
    expect(mockCampaignUpdate).not.toHaveBeenCalled();
  });

  it("never alters confirmedAmountCents or confirmedContributionCount", async () => {
    mockCampaignFindUnique.mockResolvedValue({ confirmedAmountCents: 100 });
    mockCampaignUpdate.mockResolvedValue({});

    await updateCampaignTargetAction({}, formDataWith({ targetDollars: "2000000" }));

    const updateCall = mockCampaignUpdate.mock.calls[0][0];
    expect(Object.keys(updateCall.data)).toEqual(["targetAmountCents"]);
  });
});
