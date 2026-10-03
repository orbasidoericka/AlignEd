import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAssessmentStore } from "@/store/useAssessmentStore";

import { ProfileForm } from "./profile-form";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function fillProfile() {
  fireEvent.change(screen.getByLabelText(/What should we call you/i), {
    target: { value: "MARI" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /Grade 12/i }));
  fireEvent.change(screen.getByLabelText(/How old are you/i), {
    target: { value: "17" },
  });
}

const consentBox = () =>
  screen.getByRole("checkbox", { name: /Data Privacy Policy/i });

describe("ProfileForm privacy consent", () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset();
    push.mockClear();
  });

  it("blocks the assessment until the privacy notice is agreed to", () => {
    render(<ProfileForm />);
    fillProfile();

    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Agree to the Data Privacy Policy to continue/i),
    ).toBeInTheDocument();
  });

  it("continues once every field and the consent box are filled", () => {
    render(<ProfileForm />);
    fillProfile();
    fireEvent.click(consentBox());

    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(useAssessmentStore.getState().profile.privacyAccepted).toBe(true);
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");
  });

  it("agreeing inside the policy dialog ticks the box", () => {
    render(<ProfileForm />);
    fillProfile();
    expect(consentBox()).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Data Privacy Policy" }));
    fireEvent.click(screen.getByRole("button", { name: /^I agree$/i }));

    expect(consentBox()).toBeChecked();
    expect(useAssessmentStore.getState().profile.privacyAccepted).toBe(true);
  });

  it("lets a student withdraw consent, which blocks the assessment again", () => {
    render(<ProfileForm />);
    fillProfile();
    fireEvent.click(consentBox());
    fireEvent.click(consentBox());

    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(useAssessmentStore.getState().profile.privacyAccepted).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});
