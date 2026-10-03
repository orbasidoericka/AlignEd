import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import {
  SESSION_TTL_MS,
  useAssessmentStore,
} from "@/store/useAssessmentStore";

import { SessionExpiryGuard } from "./session-expiry-guard";

const replace = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => ({ current: "/assessment" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname.current,
}));

// The guard gates on useHydrated, which is false during the first render; make
// it true so the effect runs under test.
vi.mock("@/hooks/use-hydrated", () => ({ useHydrated: () => true }));

function seedSession() {
  const { setProfile, setAnswer } = useAssessmentStore.getState();
  setProfile({ nickname: "MARI", gradeLevel: "12" });
  setAnswer(QUESTIONS[0]!.id, { trait: QUESTIONS[0]!.trait, value: 1 });
}

describe("SessionExpiryGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAssessmentStore.getState().reset();
    replace.mockClear();
    pathname.current = "/assessment";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("wipes the session and leaves the page once the TTL elapses", () => {
    seedSession();
    render(<SessionExpiryGuard />);

    act(() => {
      vi.advanceTimersByTime(SESSION_TTL_MS + 1000);
    });

    const state = useAssessmentStore.getState();
    expect(state.answers).toEqual({});
    expect(state.profile.nickname).toBe("");
    expect(state.lastUpdated).toBeNull();
    expect(replace).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("keeps the session alive while the student is still answering", () => {
    seedSession();
    render(<SessionExpiryGuard />);

    // Just shy of the TTL, a new answer restamps the session.
    act(() => {
      vi.advanceTimersByTime(SESSION_TTL_MS - 1000);
    });
    act(() => {
      useAssessmentStore
        .getState()
        .setAnswer(QUESTIONS[1]!.id, { trait: QUESTIONS[1]!.trait, value: 1 });
    });
    // The original deadline passes, but the session is younger than the TTL.
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(replace).not.toHaveBeenCalled();
    expect(Object.keys(useAssessmentStore.getState().answers)).toHaveLength(2);
  });

  it("wipes silently on the landing page, without redirecting", () => {
    pathname.current = "/";
    seedSession();
    render(<SessionExpiryGuard />);

    act(() => {
      vi.advanceTimersByTime(SESSION_TTL_MS + 1000);
    });

    expect(useAssessmentStore.getState().profile.nickname).toBe("");
    expect(replace).not.toHaveBeenCalled();
  });

  it("does nothing when there is no saved session", () => {
    render(<SessionExpiryGuard />);
    act(() => {
      vi.advanceTimersByTime(SESSION_TTL_MS * 2);
    });
    expect(replace).not.toHaveBeenCalled();
  });
});
