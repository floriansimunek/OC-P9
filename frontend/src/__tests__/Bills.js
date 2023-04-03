/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { formatDate, formatStatus } from "../app/format.js";

import mockStore from "../__mocks__/store.js";
jest.mock("../app/Store", () => mockStore);

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			);
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");

			//TODO: "toHaveClass()" not working
			expect(windowIcon.classList.contains("active-icon")).toBe(true);
		});

		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
			const antiChrono = (a, b) => b - a;
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});

		describe("When I click on icon eye", () => {
			test("Then modal should open", async () => {
				const billsContainer = new Bills({
					document,
					onNavigate,
					firestore: null,
					bills,
					localStorage: window.localStorage,
				});

				const modal = document.querySelector("#modaleFile");
				const iconEye = screen.getAllByTestId("icon-eye");
				const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye);
				iconEye.forEach((icon) => {
					icon.addEventListener("click", () => {
						handleClickIconEye(icon);
					});
				});
				userEvent.click(iconEye[0]);

				expect(handleClickIconEye).toHaveBeenCalled();
				await new Promise((resolve) => setTimeout(resolve, 50));
				//TODO: "toHaveClass()" not working
				expect(modal.classList.contains("show")).toBe(true);
			});
		});

		describe("When I click on 'New Bill' button", () => {
			test("Then I should be redirect to the page", () => {
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};
				const billsContainer = new Bills({
					document,
					onNavigate,
					firestore: null,
					bills,
					localStorage: window.localStorage,
				});

				const buttonNewBill = screen.getByTestId("btn-new-bill");
				const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill());
				buttonNewBill.addEventListener("click", handleClickNewBill);
				userEvent.click(buttonNewBill);

				expect(handleClickNewBill).toHaveBeenCalled();
				expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
			});
		});

		describe("When I call the API", () => {
			test("Then it should call getBills() & retrieve 4 bills from mocked store", async () => {
				const billsContainer = new Bills({
					document,
					onNavigate,
					store: mockStore,
					localStorage: window.localStorage,
				});

				const getBills = jest.fn(() => billsContainer.getBills());
				const result = await getBills();
				expect(getBills).toHaveBeenCalled();
				expect(result.length).toBe(4);
			});
		});
	});
});
