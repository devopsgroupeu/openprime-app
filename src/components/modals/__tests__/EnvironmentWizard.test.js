import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EnvironmentWizard from "../EnvironmentWizard";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ToastProvider } from "../../../contexts/ToastContext";
import { createEmptyEnvironment } from "../../../config/environmentsConfig";

// Mock components that might not be available in test environment
jest.mock("../AIChatModal", () => {
  return function MockAIChatModal() {
    return <div data-testid="ai-chat-modal" />;
  };
});

const MockWrapper = ({ children }) => (
  <ThemeProvider>
    <ToastProvider>{children}</ToastProvider>
  </ThemeProvider>
);

describe("EnvironmentWizard", () => {
  const defaultProps = {
    newEnv: createEmptyEnvironment("aws"),
    setNewEnv: jest.fn(),
    expandedServices: {},
    setExpandedServices: jest.fn(),
    onClose: jest.fn(),
    onCreate: jest.fn(),
    onEditHelmValues: jest.fn(),
    isEditMode: false,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders successfully without crashing", () => {
    render(
      <MockWrapper>
        <EnvironmentWizard {...defaultProps} />
      </MockWrapper>,
    );

    expect(screen.getByText("Create New Environment")).toBeInTheDocument();
  });

  it("shows edit mode when isEditMode is true", () => {
    render(
      <MockWrapper>
        <EnvironmentWizard
          {...defaultProps}
          isEditMode={true}
          newEnv={{
            ...defaultProps.newEnv,
            name: "Test Environment",
          }}
        />
      </MockWrapper>,
    );

    expect(screen.getByText("Edit Environment")).toBeInTheDocument();
  });

  it("shows step indicator with correct steps", () => {
    render(
      <MockWrapper>
        <EnvironmentWizard {...defaultProps} />
      </MockWrapper>,
    );

    expect(screen.getAllByText("Basic Configuration")).toHaveLength(2); // Header and step indicator
    expect(screen.getByText("Services Configuration")).toBeInTheDocument();
  });

  it("allows navigation to next step when current step is valid", async () => {
    const mockSetNewEnv = jest.fn();
    const newEnv = {
      ...createEmptyEnvironment("aws"),
      name: "Test Environment",
      type: "aws",
      region: "us-east-1",
    };

    render(
      <MockWrapper>
        <EnvironmentWizard {...defaultProps} newEnv={newEnv} setNewEnv={mockSetNewEnv} />
      </MockWrapper>,
    );

    const nextButton = screen.getByText("Continue");
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();

    render(
      <MockWrapper>
        <EnvironmentWizard {...defaultProps} onClose={mockOnClose} />
      </MockWrapper>,
    );

    // Find the X button (close button) - it should be the first button
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons[0]; // First button should be the X close button
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <MockWrapper>
        <EnvironmentWizard {...defaultProps} isLoading={true} />
      </MockWrapper>,
    );

    expect(screen.getByText("Creating environment...")).toBeInTheDocument();
  });

  it("shows update text in edit mode", () => {
    render(
      <MockWrapper>
        <EnvironmentWizard {...defaultProps} isEditMode={true} isLoading={true} />
      </MockWrapper>,
    );

    expect(screen.getByText("Updating environment...")).toBeInTheDocument();
  });

  it("renders within error boundary and catches errors gracefully", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Force an error by passing invalid props
    const invalidProps = {
      ...defaultProps,
      newEnv: null, // This should trigger the null check in WizardContainer
    };

    render(
      <MockWrapper>
        <EnvironmentWizard {...invalidProps} />
      </MockWrapper>,
    );

    // Should render error boundary when newEnv is null
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("handles environment name input correctly", () => {
    const mockSetNewEnv = jest.fn();

    render(
      <MockWrapper>
        <EnvironmentWizard {...defaultProps} setNewEnv={mockSetNewEnv} />
      </MockWrapper>,
    );

    const nameInput = screen.getByPlaceholderText(/production, staging/i);
    fireEvent.change(nameInput, {
      target: { value: "My Test Environment" },
    });

    expect(mockSetNewEnv).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Test Environment",
      }),
    );
  });
});
