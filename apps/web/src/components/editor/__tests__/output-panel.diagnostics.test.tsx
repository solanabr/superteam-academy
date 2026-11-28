// @vitest-environment jsdom
// The Output tab of a failed build whose errors have a place in the editor.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";
import { OutputPanel } from "../output-panel";
import type { EditorMarker, ExecutionResult } from "../types";

const LOG = [
  "   Compiling counter v0.1.0 (/build)",
  "error[E0425]: cannot find value `missing_value` in this scope",
  " --> src/lib.rs:7:5",
].join("\n");

const compiles: TestCase = {
  id: "t1",
  description: "Program compiles successfully",
  input: "",
  expectedOutput: "true",
};

function marker(line: number, overrides: Partial<EditorMarker> = {}) {
  return {
    line,
    column: 5,
    endLine: line,
    endColumn: 9,
    severity: "error",
    code: null,
    message: `error on line ${line}`,
    ...overrides,
  } satisfies EditorMarker;
}

function failedBuild(markers?: EditorMarker[]): ExecutionResult {
  return {
    success: false,
    output: "",
    error: LOG,
    testResults: [
      { testCase: compiles, passed: false, actualOutput: "error[E0425]" },
    ],
    ...(markers ? { markers } : {}),
  };
}

function panel(
  executionResult: ExecutionResult,
  onSelectMarker?: (marker: EditorMarker) => void
) {
  return (
    <OutputPanel
      executionResult={executionResult}
      isRunning={false}
      onClear={vi.fn()}
      onSelectMarker={onSelectMarker}
    />
  );
}

function renderPanel(
  executionResult: ExecutionResult,
  onSelectMarker?: (marker: EditorMarker) => void,
  locale: "en" | "es" | "pt-BR" = "en"
) {
  const messages = { en, es, "pt-BR": ptBR }[locale];
  const view = render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {panel(executionResult, onSelectMarker)}
    </NextIntlClientProvider>
  );
  // A failed run brings the Tests tab forward; the list is in Output.
  fireEvent.mouseDown(screen.getAllByRole("tab")[0]!);
  return {
    ...view,
    rerenderPanel: (next: ExecutionResult) => {
      view.rerender(
        <NextIntlClientProvider locale={locale} messages={messages}>
          {panel(next, onSelectMarker)}
        </NextIntlClientProvider>
      );
      fireEvent.mouseDown(screen.getAllByRole("tab")[0]!);
    },
  };
}

const errorList = () => screen.queryByRole("list", { name: "Compiler errors" });
const logToggle = () =>
  screen.queryByRole("button", { name: /full compiler log/i });

describe("OutputPanel: a failed build with positioned errors", () => {
  it("lists the errors as line and message, with the code when there is one", () => {
    renderPanel(
      failedBuild([
        marker(4, {
          code: "E0425",
          message: "cannot find value `missing_value` in this scope",
        }),
        marker(9),
      ])
    );

    const items = within(errorList()!).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Line 4: cannot find value `missing_value` in this scope [E0425]",
      "Line 9: error on line 9",
    ]);
  });

  it("lists at most three errors and no warnings", () => {
    renderPanel(
      failedBuild([
        marker(1),
        marker(2),
        marker(3),
        marker(4),
        marker(5, { severity: "warning", message: "unused" }),
      ])
    );

    const items = within(errorList()!).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Line 1: error on line 1",
      "Line 2: error on line 2",
      "Line 3: error on line 3",
    ]);
    expect(screen.queryByText(/unused/)).not.toBeInTheDocument();
  });

  it("keeps the full compiler log closed until it is asked for", () => {
    renderPanel(failedBuild([marker(4)]));

    const toggle = logToggle()!;
    expect(toggle).toHaveAccessibleName("Show the full compiler log");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const log = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(log).not.toBeVisible();
    expect(log).toHaveTextContent("Compiling counter v0.1.0");

    fireEvent.click(toggle);

    expect(toggle).toHaveAccessibleName("Hide the full compiler log");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(log).toBeVisible();

    fireEvent.click(toggle);
    expect(log).not.toBeVisible();
  });

  it("closes the log again for the next build", () => {
    const { rerenderPanel } = renderPanel(failedBuild([marker(4)]));
    fireEvent.click(logToggle()!);
    expect(logToggle()).toHaveAttribute("aria-expanded", "true");

    rerenderPanel(failedBuild([marker(6)]));

    expect(logToggle()).toHaveAttribute("aria-expanded", "false");
    expect(errorList()).toHaveTextContent("Line 6: error on line 6");
  });

  it("reports the error that was clicked", () => {
    const onSelectMarker = vi.fn();
    const second = marker(9, { column: 3 });
    renderPanel(failedBuild([marker(4), second]), onSelectMarker);

    fireEvent.click(screen.getByRole("button", { name: /^Line 9:/ }));

    expect(onSelectMarker).toHaveBeenCalledTimes(1);
    expect(onSelectMarker).toHaveBeenCalledWith(second);
  });

  it("shows a message as text, whatever it holds", () => {
    const message =
      '<img src=x onerror="alert(1)"> [link](https://example.test) <a href="https://example.test">a</a>';
    const { container } = renderPanel(
      failedBuild([marker(4, { message, code: "<b>E1</b>" })])
    );

    expect(errorList()).toHaveTextContent(`Line 4: ${message} [<b>E1</b>]`);
    expect(container.querySelector("img, a, b")).toBeNull();
  });

  it.each([
    ["es", "Línea 4: error on line 4", "Errores del compilador"],
    ["pt-BR", "Linha 4: error on line 4", "Erros do compilador"],
  ] as const)("is translated in %s", (locale, text, listName) => {
    renderPanel(failedBuild([marker(4)]), undefined, locale);

    expect(screen.getByRole("list", { name: listName })).toHaveTextContent(
      text
    );
  });
});

describe("OutputPanel: a build without positioned errors", () => {
  function expectAsBefore() {
    expect(errorList()).not.toBeInTheDocument();
    expect(logToggle()).not.toBeInTheDocument();
  }

  it("shows the compiler log directly when the build has no markers", () => {
    renderPanel(failedBuild());

    expectAsBefore();
    expect(screen.getByText(/Compiling counter v0\.1\.0/)).toBeVisible();
  });

  it("shows the compiler log directly when the list is empty", () => {
    renderPanel(failedBuild([]));

    expectAsBefore();
    expect(screen.getByText(/Compiling counter v0\.1\.0/)).toBeVisible();
  });

  it("shows the compiler log directly when only warnings are positioned", () => {
    renderPanel(failedBuild([marker(4, { severity: "warning" })]));

    expectAsBefore();
    expect(screen.getByText(/Compiling counter v0\.1\.0/)).toBeVisible();
  });

  it("shows the output of a build that passed, with or without warnings", () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={en}>
        {panel({
          success: true,
          output: "Program compiled successfully!\nBuild UUID: u1",
          testResults: [
            { testCase: compiles, passed: true, actualOutput: "pass" },
          ],
          markers: [marker(4, { severity: "warning" })],
        })}
      </NextIntlClientProvider>
    );

    expectAsBefore();
    expect(container).toHaveTextContent("Program compiled successfully!");
  });
});
