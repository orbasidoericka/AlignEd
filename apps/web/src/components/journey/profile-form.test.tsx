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
  fireEvent.click(
    screen.getByRole("radio", {
      name: /Science, Technology, Engineering, and Mathematics/i,
    }),
  );
  fireEvent.change(screen.getByLabelText(/How old are you/i), {
    target: { value: "17" },
  });
}

const consentBox = () =>
  screen.getByRole("checkbox", { name: /Terms and Conditions/i });

describe("ProfileForm layout and Others strand", () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset();
    push.mockClear();
  });

  it("has the new heading, no step label, and no placeholders", () => {
    render(<ProfileForm />);

    expect(
      screen.getByRole("heading", { name: "Tell us about yourself" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Step 1 of 3/i)).not.toBeInTheDocument();
    for (const label of [/What should we call you/i, /How old are you/i, /School/i]) {
      expect(screen.getByLabelText(label)).not.toHaveAttribute("placeholder");
    }
  });

  it("the consent blurb no longer mentions comparing or one year", () => {
    render(<ProfileForm />);

    expect(screen.queryByText(/compare/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/one year/i)).not.toBeInTheDocument();
  });

  it("Others reveals a field, blocks Continue until it is filled, and clears when another strand is picked", () => {
    render(<ProfileForm />);
    fillProfile();
    fireEvent.click(screen.getByRole("checkbox", { name: /Terms and Conditions/i }));
    expect(screen.queryByLabelText("Type your strand")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Others" }));
    const field = screen.getByLabelText("Type your strand");
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/Type your strand to continue/i)).toBeInTheDocument();

    fireEvent.change(field, { target: { value: "Cookery" } });
    expect(useAssessmentStore.getState().profile.strandOther).toBe("Cookery");
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");

    fireEvent.click(screen.getByRole("radio", { name: /Sports/i }));
    expect(screen.queryByLabelText("Type your strand")).not.toBeInTheDocument();
    expect(useAssessmentStore.getState().profile.strandOther).toBe("");
  });
});

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
      screen.getByText(/Agree to the Terms and Conditions to continue/i),
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

    fireEvent.click(
      screen.getByRole("button", {
        name: "Data Privacy Policy and Terms and Conditions",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^I agree$/i }));

    expect(consentBox()).toBeChecked();
    expect(useAssessmentStore.getState().profile.privacyAccepted).toBe(true);
  });

  it("the dialog lists the contact email and bolds the key points", () => {
    render(<ProfileForm />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Data Privacy Policy and Terms and Conditions",
      }),
    );
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveTextContent("aligned.career.support@gmail.com");
    expect(dialog).toHaveTextContent(/All the data we collect/i);
    expect(dialog.querySelectorAll("strong").length).toBeGreaterThan(0);
    expect(dialog).not.toHaveTextContent("**");
    expect(dialog).not.toHaveTextContent("[");
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
