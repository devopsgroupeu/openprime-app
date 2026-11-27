import { render, screen, within } from "@testing-library/react";
import { SHORTCUTS, keyLabels } from "@/lib/shortcuts";
import KeyboardShortcutsDialog from "../KeyboardShortcutsDialog";

describe("KeyboardShortcutsDialog", () => {
  it("lists every shortcut with its keys and marks browser overrides", () => {
    render(<KeyboardShortcutsDialog open onOpenChange={() => {}} />);

    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    const terms = within(dialog).getAllByRole("term");
    const definitions = within(dialog).getAllByRole("definition");
    expect(terms).toHaveLength(SHORTCUTS.length);
    expect(definitions).toHaveLength(SHORTCUTS.length);
    for (const s of SHORTCUTS) {
      const term = within(dialog).getByText(s.label);
      const keys = definitions[terms.indexOf(term)];
      for (const k of keyLabels(s)) {
        expect(within(keys).getByText(k)).toBeInTheDocument();
      }
      expect(
        within(term).queryByText("Replaces a browser shortcut") !== null,
      ).toBe(s.overridesBrowser);
    }
  });
});
