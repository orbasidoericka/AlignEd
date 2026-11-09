import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GRADE_LEVELS, SHS_STRANDS } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";

import { ProfileForm } from "./profile-form";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function fillProfile() {
  fireEvent.change(screen.getByLabelText(/What should we call you/i), {
    target: { value: "MARI" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /Grade 12/i }));
  fireEvent.change(strandSelect(), {
    target: { value: SHS_STRANDS.find((strand) => strand.startsWith("Science"))! },
  });
  fireEvent.change(screen.getByLabelText(/How old are you/i), {
    target: { value: "17" },
  });
}

const strandSelect = () =>
  screen.getByLabelText(/What is your SHS strand/i) as HTMLSelectElement;

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

  it("offers the strands in a dropdown, not as cards", () => {
    render(<ProfileForm />);

    const select = strandSelect();
    expect(select.tagName).toBe("SELECT");
    expect(select.value).toBe("");
    const options = [...select.options].map((option) => option.value);
    expect(options).toEqual(["", ...SHS_STRANDS]);
    // Grade is still the two cards; the strands are no longer radios.
    expect(screen.getAllByRole("radio")).toHaveLength(GRADE_LEVELS.length);

    fireEvent.change(select, { target: { value: "Sports" } });
    expect(useAssessmentStore.getState().profile.strand).toBe("Sports");
  });

  it("stars every required question and says what the star means", () => {
    render(<ProfileForm />);

    expect(screen.getByText(/Questions marked with/i)).toHaveTextContent(
      "Questions marked with * are required.",
    );
    for (const label of [
      /What should we call you/i,
      /What is your SHS strand/i,
      /How old are you/i,
    ]) {
      const control = screen.getByLabelText(label);
      expect(control).toHaveAttribute("aria-required", "true");
      expect(document.querySelector(`label[for="${control.id}"]`)).toHaveTextContent("*");
    }
    expect(screen.getByRole("radiogroup", { name: "Grade level" })).toHaveAttribute(
      "aria-required",
      "true",
    );
    expect(screen.getByText("What grade are you in?")).toHaveTextContent("*");
    // School is the one optional field, and carries no star.
    expect(document.querySelector('label[for="school"]')).not.toHaveTextContent("*");
    expect(consentBox().closest("label")).toHaveTextContent("*");
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

    fireEvent.change(strandSelect(), { target: { value: "Others" } });
    const field = screen.getByLabelText("Type your strand");
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/Type your strand to continue/i)).toBeInTheDocument();

    fireEvent.change(field, { target: { value: "Cookery" } });
    expect(useAssessmentStore.getState().profile.strandOther).toBe("Cookery");
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");

    // The inline row replaces the dropdown; its X brings the dropdown back.
    fireEvent.click(screen.getByRole("button", { name: "Change strand" }));
    expect(screen.queryByLabelText("Type your strand")).not.toBeInTheDocument();
    expect(useAssessmentStore.getState().profile.strandOther).toBe("");
    expect(useAssessmentStore.getState().profile.strand).toBeNull();

    fireEvent.change(strandSelect(), { target: { value: "Sports" } });
    expect(useAssessmentStore.getState().profile.strand).toBe("Sports");
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
