/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

const mockStore = {
  bills: jest.fn(() => ({
      create: jest.fn().mockResolvedValue({
          fileUrl: "testUrl",
          key: "testKey", 
      }),
      update: jest.fn().mockResolvedValue({}),
  })),
};

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(() => JSON.stringify({ email: "john@example.com" })),
    setItem: jest.fn(),
  },
  writable: true,
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then all form fields should exist", () => {
      document.body.innerHTML = NewBillUI();
      new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
      });
  
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
    })
    test("Then handleChangeFile should be called when a file is selected", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByTestId("file");
      const file = new File(["test"], "test.txt", { type: "image/png" });

      global.alert = jest.fn(); 

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(global.alert).not.toHaveBeenCalled();

      global.alert.mockRestore();
    })

    test("Then an alert should be displayed if the file type is invalid", () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByTestId("file");
      const file = new File(["test"], "test.txt", { type: "text/plain" }); 

      global.alert = jest.fn();

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(global.alert).toHaveBeenCalled(); 
      expect(fileInput.value).toBe(""); 

      global.alert.mockRestore();
    })

  })
})