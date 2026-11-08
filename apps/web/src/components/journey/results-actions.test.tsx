// Copyright (c) 2026 EdTech. All rights reserved.

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsKeepsakeActions } from "./results-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const buildShareImage = vi.hoisted(() => vi.fn());
vi.mock("@/lib/results-share/build-share-image", () => ({ buildShareImage }));

const file = new File(["png"], "aligned-holland-code.png", {
  type: "image/png",
});

function openShare() {
  render(<ResultsKeepsakeActions />);
  fireEvent.click(screen.getByRole("button", { name: "Share my results" }));
}

function stubShare(canShare: boolean) {
  const share = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { canShare: () => canShare, share });
  return share;
}

describe("Share my results", () => {
  beforeEach(() => {
    buildShareImage.mockReset();
    buildShareImage.mockResolvedValue(file);
    URL.createObjectURL = vi.fn(() => "blob:share");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, "canShare");
    Reflect.deleteProperty(navigator, "share");
  });

  it("offers Save image only where files cannot be shared", async () => {
    stubShare(false);
    openShare();

    const save = await screen.findByText("Save image");
    expect(save.closest("a")).toHaveAttribute("download", file.name);
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });

  it("shares the previewed file through the device menu", async () => {
    const share = stubShare(true);
    openShare();

    fireEvent.click(await screen.findByRole("button", { name: "Share" }));
    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0]![0].files).toEqual([file]);
    expect(screen.getByText("Save image").closest("a")).not.toBeNull();
  });

  it("reports a failed image and can try again", async () => {
    stubShare(true);
    buildShareImage.mockRejectedValueOnce(new Error("no canvas"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    openShare();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The image could not be created",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: "Share" })).toBeInTheDocument();
    expect(buildShareImage).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
