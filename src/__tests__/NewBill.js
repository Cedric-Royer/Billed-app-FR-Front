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
      const file = new File(["test"], "test.png", { type: "image/png" });

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
    test("Then the form should be submitted and the bill created", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
      });
  
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Train Paris-Lyon" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "250" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-12-08" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Voyage professionnel" } });
  
      const fileInput = screen.getByTestId("file");
      const file = new File(["test"], "test.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });
  
      fireEvent.click(screen.getByText('Envoyer')); 
  
      expect(mockStore.bills).toHaveBeenCalled();

      expect(newBill.onNavigate).toHaveBeenCalledWith("#employee/bills");
    })
    test("Then it should handle errors when the file creation fails", async () => {
      mockStore.bills = jest.fn(() => ({
        create: jest.fn().mockRejectedValueOnce(new Error("Erreur de création de fichier"))
      }));
    
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
    
      const fileInput = screen.getByTestId("file");
      const file = new File(["test"], "test.png", { type: "image/png" });
      fireEvent.change(fileInput, { target: { files: [file] } });
    
      await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error)));
    
      consoleSpy.mockRestore();
    });
    test("Then it should handle errors when the bill update fails", async () => {
      mockStore.bills = jest.fn(() => ({
        update: jest.fn().mockRejectedValueOnce(new Error("Erreur de mise à jour de la facture"))
      }));
    
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
    
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);
    
      await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error)));
    
      consoleSpy.mockRestore();
    });
    test("Then it should not try to update the bill if the store is not defined", async () => {
      const mockStoreUndefined = undefined;
    
      const updateSpy = jest.fn();
    
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStoreUndefined,
        localStorage: window.localStorage,
      });
    
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);
    
      await waitFor(() => expect(updateSpy).not.toHaveBeenCalled());
    
    });
    
    
    
    
  })
})