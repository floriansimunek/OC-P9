/**
 * @jest-environment jsdom
 */
import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store.js";
jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page", () => {
		beforeEach(() => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock });
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
					email: "employee@test.tld",
				}),
			);
			document.body.innerHTML = NewBillUI();
		});
		afterEach(() => {
			jest.restoreAllMocks();
		});

		test("change file handler should display the file name if the file format is supported", () => {
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const newBill = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage,
			});
			const handleChangeFile = jest.fn(newBill.handleChangeFile);
			const blob = new Blob([""], { type: "image/png" });
			const file = new File([blob], "test.png", { type: "image/png" });
			const input = screen.getByTestId("file");
			input.addEventListener("change", handleChangeFile);
			fireEvent.change(input, { target: { files: [file] } });
			userEvent.upload(input, file);
			expect(input.files.length).toBe(1);
			expect(input.files[0].name).toBe("test.png");
			expect(handleChangeFile).toHaveBeenCalledTimes(2);
		});
	});
});
