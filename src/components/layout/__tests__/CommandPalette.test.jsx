import { fireEvent, render, screen } from "@testing-library/react";
import { useCallback, useState } from "react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router";
import { Plus } from "lucide-react";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import CommandPalette, { usePaletteActions } from "../CommandPalette";

// AppLayout in small: the outlet context is the page group's setter, and the
// open palette shows the group.
function Layout({ onRegister }) {
  const [group, setGroup] = useState(null);
  const register = useCallback(
    (next) => {
      onRegister(next);
      setGroup(next);
    },
    [onRegister],
  );
  return (
    <>
      <Outlet context={register} />
      <CommandPalette
        open
        onOpenChange={() => {}}
        onShortcuts={() => {}}
        environments={[]}
        pageActions={group}
      />
    </>
  );
}

function Page({ busy, onRun }) {
  usePaletteActions({
    heading: "This page",
    actions: [{ label: "Run", icon: Plus, onSelect: onRun, disabled: busy }],
  });
  return null;
}

const tree = (onRegister, page) => (
  <ThemeProvider>
    <MemoryRouter>
      <Routes>
        <Route element={<Layout onRegister={onRegister} />}>
          <Route index element={page} />
        </Route>
      </Routes>
    </MemoryRouter>
  </ThemeProvider>
);

describe("usePaletteActions", () => {
  it("registers again only when what the palette shows changes", () => {
    const onRegister = vi.fn();
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = render(
      tree(onRegister, <Page busy={false} onRun={first} />),
    );
    rerender(tree(onRegister, <Page busy={false} onRun={latest} />));
    expect(onRegister).toHaveBeenCalledTimes(1);

    // The registered action runs the page's latest callback.
    fireEvent.click(screen.getByRole("option", { name: "Run" }));
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);

    rerender(tree(onRegister, <Page busy onRun={latest} />));
    expect(onRegister.mock.calls.filter(([g]) => g)).toHaveLength(2);
    expect(screen.getByRole("option", { name: "Run" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
