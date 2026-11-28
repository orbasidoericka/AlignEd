import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUESTIONS } from "@/lib/riasec/questions";
import { GRADE_LEVELS, SHS_STRANDS } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";

import {
  PRIVACY_CONTACT_EMAIL,
  REQUIRE_READ_BEFORE_CONSENT,
} from "./privacy-consent";
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

// The box stays locked until both tabs have been read to the end. jsdom has
// no layout, so a panel that mounts counts as fully scrolled.
function readPolicy() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Data Privacy Policy and Terms and Conditions",
    }),
  );
  fireEvent.click(screen.getByRole("tab", { name: "Terms and Conditions" }));
  fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);
}

describe("ProfileForm scoring notice", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    useAssessmentStore.getState().reset();
  });

  it("opens on arrival and shows the four steps", () => {
    render(<ProfileForm />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("How your code is scored");
    expect(dialog.querySelectorAll("ol > li")).toHaveLength(4);
  });

  it("closes on 'I understand' and stays closed after a remount once started", () => {
    const { unmount } = render(<ProfileForm />);

    fireEvent.click(screen.getByRole("button", { name: "I understand" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    useAssessmentStore.getState().setProfile({ nickname: "MARI" });
    unmount();
    render(<ProfileForm />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens again on an empty form, e.g. after leaving and coming back", () => {
    const { unmount } = render(<ProfileForm />);

    fireEvent.click(screen.getByRole("button", { name: "I understand" }));
    unmount();
    render(<ProfileForm />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("is told in Filipino when the language is Filipino", () => {
    useAssessmentStore.getState().setLanguage("fil");
    render(<ProfileForm />);

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Sagutan ang 42 pahayag",
    );
    expect(
      screen.getByRole("button", { name: "Naiintindihan ko" }),
    ).toBeInTheDocument();
  });
});

describe("ProfileForm layout and Others strand", () => {
  beforeEach(() => {
    // The scoring notice has its own tests; here it is already acknowledged.
    window.sessionStorage.setItem("aligned.scoring-notice", "1");
    useAssessmentStore.getState().reset();
    // Empty form reopens the notice, so start these past it.
    useAssessmentStore.getState().setProfile({ nickname: "A" });
    push.mockClear();
  });

  it("has the new heading, no step label, and no placeholders", () => {
    render(<ProfileForm />);

    expect(
      screen.getByRole("heading", { name: "Tell us about yourself" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Step 1 of 3/i)).not.toBeInTheDocument();
    for (const label of [/What should we call you/i, /How old are you/i]) {
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
    // School is no longer asked.
    expect(document.getElementById("school")).toBeNull();
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
    readPolicy();
    fireEvent.click(screen.getByRole("checkbox", { name: /Terms and Conditions/i }));
    expect(screen.queryByLabelText("Type your strand")).not.toBeInTheDocument();

    fireEvent.change(strandSelect(), { target: { value: "Others" } });
    const field = screen.getByLabelText("Type your strand");
    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/Type your strand to continue/i)).toBeInTheDocument();

    fireEvent.change(field, { target: { value: "Cookery" } });
    expect(useAssessmentStore.getState().profile.strandOther).toBe("Cookery");
    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));
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
    // The scoring notice has its own tests; start past it (read, and started).
    window.sessionStorage.setItem("aligned.scoring-notice", "1");
    useAssessmentStore.getState().reset();
    useAssessmentStore.getState().setProfile({ nickname: "A" });
    push.mockClear();
  });

  it("blocks the assessment until the privacy notice is agreed to", () => {
    render(<ProfileForm />);
    fillProfile();

    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));

    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Agree to the Terms and Conditions to continue/i),
    ).toBeInTheDocument();
  });

  it("blocks an age under 15 and says the minimum", () => {
    render(<ProfileForm />);
    fillProfile();
    readPolicy();
    fireEvent.click(consentBox());
    const age = screen.getByLabelText(/How old are you/i);

    fireEvent.change(age, { target: { value: "10" } });
    expect(screen.getByText("Enter an age of 15 or older.")).toBeInTheDocument();
    expect(age).toHaveAttribute("aria-invalid", "true");
    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));
    expect(push).not.toHaveBeenCalled();

    fireEvent.change(age, { target: { value: "35" } });
    expect(
      screen.queryByText("Enter an age of 15 or older."),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");
  });

  it("does not flag the first digit of an age while it is typed", () => {
    render(<ProfileForm />);
    fireEvent.change(screen.getByLabelText(/How old are you/i), {
      target: { value: "1" },
    });
    expect(
      screen.queryByText("Enter an age of 15 or older."),
    ).not.toBeInTheDocument();
  });

  it("continues once every field and the consent box are filled", () => {
    render(<ProfileForm />);
    fillProfile();
    readPolicy();
    fireEvent.click(consentBox());

    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));

    expect(useAssessmentStore.getState().profile.privacyAccepted).toBe(true);
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");
  });

  it.skipIf(REQUIRE_READ_BEFORE_CONSENT)("ticks straight away while the read-both-tabs gate is off", () => {
    render(<ProfileForm />);
    fillProfile();
    fireEvent.click(consentBox());
    expect(consentBox()).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");
  });

  it.skipIf(!REQUIRE_READ_BEFORE_CONSENT)("will not tick until both documents are read, then jumps to the Terms", () => {
    // jsdom has no layout: fake a tall panel so scrolling matters.
    const spies = [
      vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(1000),
      vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(200),
    ];
    try {
      render(<ProfileForm />);
      fillProfile();

      // Ticking unread is refused with a "you must read" message.
      fireEvent.click(consentBox());
      expect(consentBox()).not.toBeChecked();
      expect(
        screen.getByText(
          "You must read the Data Privacy Policy and the Terms and Conditions to the end before you agree.",
        ),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Data Privacy Policy and Terms and Conditions",
        }),
      );
      const dialog = screen.getByRole("dialog");
      const scrollToEnd = () => {
        const panel = screen
          .getByRole("tabpanel")
          .querySelector("div.overflow-y-auto") as HTMLElement;
        panel.scrollTop = 800;
        fireEvent.scroll(panel);
      };

      // "I agree" too early is refused.
      fireEvent.click(screen.getByRole("button", { name: /^I agree$/i }));
      expect(useAssessmentStore.getState().profile.privacyAccepted).toBe(false);

      // Reaching the end of the Privacy tab swings over to the Terms.
      expect(dialog).toHaveTextContent(/All the data we collect/i);
      scrollToEnd();
      expect(dialog).toHaveTextContent(/Students under 18/i);

      scrollToEnd();
      fireEvent.click(screen.getByRole("button", { name: /^I agree$/i }));
      expect(consentBox()).toBeChecked();
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });

  it("agreeing inside the policy dialog ticks the box", () => {
    render(<ProfileForm />);
    fillProfile();
    expect(consentBox()).not.toBeChecked();

    readPolicy();
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

    expect(dialog).toHaveTextContent(PRIVACY_CONTACT_EMAIL);
    expect(dialog).toHaveTextContent(/All the data we collect/i);
    expect(dialog.querySelectorAll("strong").length).toBeGreaterThan(0);
    expect(dialog).not.toHaveTextContent("**");
    expect(dialog).not.toHaveTextContent("[");
  });

  it("separates the Data Privacy Policy and Terms and Conditions into their own tabs", () => {
    render(<ProfileForm />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Data Privacy Policy and Terms and Conditions",
      }),
    );
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveTextContent(/All the data we collect/i);
    expect(dialog).not.toHaveTextContent(/Students under 18/i);

    fireEvent.click(
      screen.getByRole("tab", { name: "Terms and Conditions" }),
    );

    expect(dialog).toHaveTextContent(/Students under 18/i);
    expect(dialog).not.toHaveTextContent(/All the data we collect/i);
  });

  it("lets a student withdraw consent, which blocks the assessment again", () => {
    render(<ProfileForm />);
    fillProfile();
    readPolicy();
    fireEvent.click(consentBox());
    fireEvent.click(consentBox());

    fireEvent.click(screen.getByRole("button", { name: /Take Assessment/i }));

    expect(useAssessmentStore.getState().profile.privacyAccepted).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });
});

describe("ProfileForm with an unfinished assessment", () => {
  beforeEach(() => {
    window.sessionStorage.setItem("aligned.scoring-notice", "1");
    useAssessmentStore.getState().reset();
    useAssessmentStore.getState().setProfile({
      nickname: "MARI",
      gradeLevel: "12",
      strand: "Sports",
      age: "17",
      privacyAccepted: true,
    });
    push.mockClear();
  });

  const answer = (count: number) => {
    for (const question of QUESTIONS.slice(0, count)) {
      useAssessmentStore
        .getState()
        .setAnswer(question.id, { trait: question.trait, value: 1 });
    }
  };
  const button = (name: string) => screen.queryByRole("button", { name });
  const answered = () =>
    Object.keys(useAssessmentStore.getState().answers).length;

  it.each([0, QUESTIONS.length])(
    "keeps the single button with %i answers",
    (count) => {
      answer(count);
      render(<ProfileForm />);

      expect(button("Take Assessment")).toBeInTheDocument();
      expect(button("Continue Assessment")).toBeNull();
      expect(button("New Assessment")).toBeNull();
    },
  );

  it("continues with the saved answers", () => {
    answer(3);
    render(<ProfileForm />);

    expect(button("Take Assessment")).toBeNull();
    fireEvent.click(button("Continue Assessment")!);

    expect(answered()).toBe(3);
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");
  });

  it("starts over only after the confirmation, keeping the profile", () => {
    answer(3);
    render(<ProfileForm />);

    fireEvent.click(button("New Assessment")!);
    const dialog = screen.getByRole("alertdialog");
    expect(answered()).toBe(3);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "New Assessment" }),
    );

    expect(answered()).toBe(0);
    expect(useAssessmentStore.getState().profile.nickname).toBe("MARI");
    expect(push).toHaveBeenCalledExactlyOnceWith("/assessment");
  });

  it("keeps the answers when the confirmation is closed", () => {
    answer(3);
    render(<ProfileForm />);

    fireEvent.click(button("New Assessment")!);
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Close",
      }),
    );

    expect(answered()).toBe(3);
    expect(push).not.toHaveBeenCalled();
  });

  it("asks for the missing details before either choice", () => {
    answer(3);
    useAssessmentStore.getState().setProfile({ privacyAccepted: false });
    render(<ProfileForm />);

    fireEvent.click(button("New Assessment")!);

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(
      screen.getByText(/Agree to the Terms and Conditions to continue/i),
    ).toBeInTheDocument();
    expect(answered()).toBe(3);
  });
});
