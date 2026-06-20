import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin, mockUpdateMany, mockRevalidatePath } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { contribution: { updateMany: mockUpdateMany } },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

const { setContributionNameHiddenAction } = await import("@/app/admin/contributions/actions");

function formDataWith(contributionId: string, hidden: string) {
  const formData = new FormData();
  formData.set("contributionId", contributionId);
  formData.set("hidden", hidden);
  return formData;
}

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockUpdateMany.mockReset();
  mockRevalidatePath.mockReset();
  mockRequireAdmin.mockResolvedValue({ id: "admin_1", email: "admin@example.com" });
});

describe("setContributionNameHiddenAction", () => {
  it("requires server-side authorization before touching the database", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("REDIRECT:/admin/login"));

    await expect(
      setContributionNameHiddenAction({}, formDataWith("contrib_1", "true")),
    ).rejects.toThrow("REDIRECT:/admin/login");

    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("updates only publicNameHidden — never amount, status, provider IDs, or refund amount", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });

    await setContributionNameHiddenAction({}, formDataWith("contrib_1", "true"));

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "contrib_1" },
      data: { publicNameHidden: true },
    });
  });

  it("restores a name by setting publicNameHidden to false", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });

    await setContributionNameHiddenAction({}, formDataWith("contrib_1", "false"));

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "contrib_1" },
      data: { publicNameHidden: false },
    });
  });

  it("revalidates the admin and public pages after a successful change", async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });

    await setContributionNameHiddenAction({}, formDataWith("contrib_1", "true"));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/contributions");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("returns a generic error for a missing contributionId, without touching the database", async () => {
    const result = await setContributionNameHiddenAction({}, formDataWith("", "true"));

    expect(result.error).toBeTruthy();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns a generic error for a malformed hidden value", async () => {
    const result = await setContributionNameHiddenAction({}, formDataWith("contrib_1", "not-a-boolean"));

    expect(result.error).toBeTruthy();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns a generic error, without leaking details, when the contribution does not exist", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const result = await setContributionNameHiddenAction({}, formDataWith("missing", "true"));

    expect(result.error).toBeTruthy();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns a generic error, without leaking details, on a database error", async () => {
    mockUpdateMany.mockRejectedValue(new Error("connection reset by peer at 10.0.0.5"));

    const result = await setContributionNameHiddenAction({}, formDataWith("contrib_1", "true"));

    expect(result.error).toBe("Something went wrong. Try again.");
  });
});
