/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from '../containers/Bills.js';
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import store from "../app/store";

import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList).toContain('active-icon');
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on the eye icon", () => {
      test('Then clicking on an eye icon should open modal ', () => {
        $.fn.modal = jest.fn()
        new Bills({ document })
        const iconEye = screen.getAllByTestId("icon-eye")[0]
        iconEye.click();
        expect($.fn.modal).toHaveBeenCalledWith("show");
      });
    })

    describe("When I call getBills", () => {
      test("should log an error and return unformatted data when formatDate fails", async () => {
        const corruptedBills = [
          {
            id: "1",
            status: "pending",
            date: "invalid-date",
            amount: 100,
          },
        ];

        jest.spyOn(mockStore.bills(), "list").mockResolvedValueOnce(corruptedBills);

        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        const billsContainer = new Bills({ document, store: mockStore });

        const result = await billsContainer.getBills();

        expect(consoleSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[0][0]).toBeInstanceOf(Error);
        expect(consoleSpy.mock.calls[0][1]).toBe("for");
        expect(consoleSpy.mock.calls[0][2]).toEqual(corruptedBills[0]);
        expect(result[0].date).toBe("invalid-date");

        consoleSpy.mockRestore();
      });
    })
  })
  describe('Given I am a user connected as an employee', () => {
    describe("When I am on Bills Page", () => {
      describe("When I click on the eye icon", () => {
        test("Then clicking on an eye icon should call handleClickIconEye", async () => {
          const billsContainer = new Bills({ document })
          const handleClickIconEyeSpy = jest.spyOn(billsContainer, 'handleClickIconEye')
          const iconEye = screen.getAllByTestId("icon-eye")[0]
          iconEye.click()
          expect(handleClickIconEyeSpy).toHaveBeenCalledWith(iconEye)
        })

        test('Then clicking on an eye icon should open modal', () => {
          $.fn.modal = jest.fn()
          new Bills({ document })
          const iconEye = screen.getAllByTestId("icon-eye")[0]
          iconEye.click()
          expect($.fn.modal).toHaveBeenCalledWith("show")
        })

        test('Then clicking on eye icons should open modal for each icon', () => {
          $.fn.modal = jest.fn();
          document.body.innerHTML = `
            <div data-testid="icon-eye" data-bill-url="url1"></div>
            <div data-testid="icon-eye" data-bill-url="url2"></div>
            <div data-testid="icon-eye" data-bill-url="url3"></div>
          `;

          const billsInstance = new Bills({ document });
          const iconEyes = screen.getAllByTestId("icon-eye");

          iconEyes.forEach(icon => {
            icon.click();
          });

          expect($.fn.modal).toHaveBeenCalledTimes(3);
          expect($.fn.modal).toHaveBeenCalledWith("show");
        });

        test('should not call handleClickIconEye when iconEye is falsy', () => {

          document.querySelectorAll = jest.fn(() => null);

          const billsInstance = new Bills({
            document,
            onNavigate: jest.fn(),
            store: {},
            localStorage: {}
          });

          const handleClickIconEyeSpy = jest.spyOn(billsInstance, 'handleClickIconEye');

          expect(handleClickIconEyeSpy).not.toHaveBeenCalled();
        });
      })
    })

    describe("When I am on Bills Page and I call getBills", () => {
      test('Then it should return the bills sorted by date and formatted correctly', async () => {
        const billsContainer = new Bills({ document, store: store });
        const billsFromGetBills = await billsContainer.getBills();

        expect(Array.isArray(billsFromGetBills)).toBe(true);

        const dates = billsFromGetBills.map(bill => bill.date);
        const sortedDates = [...dates].sort((a, b) => new Date(a) - new Date(b));
        expect(dates).toEqual(sortedDates);
      });

      test('Then it should handle 404 error correctly if the API call fails with a 404', async () => {
        jest.spyOn(store.bills(), "list").mockRejectedValueOnce(new Error("Erreur 404"));

        const billsContainer = new Bills({ document });

        try {
          await billsContainer.getBills();
        } catch (error) {
          expect(error.message).toBe("Erreur 404");
        }
      });

      test('Then it should handle 500 error correctly if the API call fails with a 500', async () => {
        jest.spyOn(mockStore.bills(), "list").mockRejectedValueOnce(new Error("Erreur 500"));

        const billsContainer = new Bills({ document });

        try {
          await billsContainer.getBills();
        } catch (error) {
          expect(error.message).toBe("Erreur 500");
        }
      });
    });

    describe("When formatDate is called", () => {
      test("Then it should throw an error with an invalid date", () => {
        expect(() => formatDate("invalid-date")).toThrowError();
      });
    });
  });
});
