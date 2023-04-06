/**
 * @jest-environment jsdom
 */
import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";

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

		test("Then change file handler should display the file name if the file format is supported", () => {
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

		test("Then change file handler should display the error if the file format is not supported", () => {
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
			const file = new File([blob], "test.webp", { type: "webp" });
			const input = screen.getByTestId("file");
			const errorDiv = document.querySelector("#fileError");
			input.addEventListener("change", handleChangeFile);
			fireEvent.change(input, { target: { files: [file] } });
			userEvent.upload(input, file);
			expect(errorDiv.classList.contains("error")).toBe(true);
		});

		test("Then it should submit new bill when I fill correctly fields", async () => {
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const newBill = new NewBill({
				document,
				onNavigate,
				store: mockStore,
				localStorage: window.localStorage,
			});
			const handleSubmit = jest.fn(newBill.handleSubmit);
			const form = screen.getByTestId("form-new-bill");
			form.addEventListener("submit", handleSubmit);
			const uint8 = new Uint8Array([0xff, 0xd8, 0xff]); // JPEG signature
			const file = new File([uint8], "test.jpeg", { type: "image/jpeg" });
			const input = screen.getByTestId("file");
			input.addEventListener("change", newBill.handleChangeFile);
			fireEvent.change(input, {
				target: {
					files: [file],
				},
			});
			fireEvent.change(screen.getByTestId("expense-name"), {
				target: { value: "test" },
			});
			fireEvent.change(screen.getByTestId("datepicker"), {
				target: { value: "2021-03-01" },
			});
			fireEvent.change(screen.getByTestId("amount"), {
				target: { value: "100" },
			});
			fireEvent.change(screen.getByTestId("vat"), {
				target: { value: "20" },
			});
			fireEvent.change(screen.getByTestId("pct"), {
				target: { value: undefined },
			});
			fireEvent.change(screen.getByTestId("commentary"), {
				target: { value: "test" },
			});
			newBill.fileName = "test.jpeg";
			newBill.fileUrl = "http://localhost:3000/test.jpeg";
			const submitButton = screen.getByText("Envoyer");
			submitButton.addEventListener("click", handleSubmit);
			fireEvent.submit(form);
			expect(handleSubmit).toBeCalledTimes(1);
		});
	});
});
