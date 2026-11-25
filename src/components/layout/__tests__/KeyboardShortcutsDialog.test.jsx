import { render, screen, within } from "@testing-library/react";
import { SHORTCUTS, keyLabels } from "@/lib/shortcuts";
import KeyboardShortcutsDialog from "../KeyboardShortcutsDialog";

describe("KeyboardShortcutsDialog", () => {
  it("lists every shortcut with its keys and marks browser overrides", () => {
    render(<KeyboardShortcutsDialog open onOpenChange={() => {}} />);

    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    for (const s of SHORTCUTS) {
      const row = within(dialog).getByText(s.label).closest("div");
      for (const k of keyLabels(s)) {
        expect(within(row).getByText(k)).toBeInTheDocument();
      }
      expect(
        within(row).queryByText("Replaces a browser shortcut") !== null,
      ).toBe(s.overridesBrowser);
    }
  });
});
