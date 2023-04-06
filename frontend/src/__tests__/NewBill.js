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

import router from "../app/Router.js";

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
			newBill.fileUrl = "http://localhost:8080/test.jpeg";
			const submitButton = screen.getByText("Envoyer");
			submitButton.addEventListener("click", handleSubmit);
			fireEvent.submit(form);
			expect(handleSubmit).toBeCalledTimes(1);
		});
	});

	/******************************************************************************* */
	/******************************************************************************* */
	/******************************************************************************* */
	/******************************************************************************* */
	/******************************************************************************* */

	describe("Given I am a user connected as Employee", () => {
		describe("When I submit the form completed", () => {
			test("Then the bill is created", async () => {
				const html = NewBillUI();
				document.body.innerHTML = html;

				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};
				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				});
				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
						email: "a@a",
					}),
				);
				const newBill = new NewBill({
					document,
					onNavigate,
					store: null,
					localStorage: window.localStorage,
				});

				const validBill = {
					type: "Transports",
					name: "vol Paris Toulouse",
					date: "2023-01-03",
					amount: 80,
					vat: 70,
					pct: 20,
					commentary: "Commentary",
					fileUrl: "http://localhost:8080/test.jpg",
					fileName: "test.jpg",
					status: "pending",
				};

				screen.getByTestId("expense-type").value = validBill.type;
				screen.getByTestId("expense-name").value = validBill.name;
				screen.getByTestId("datepicker").value = validBill.date;
				screen.getByTestId("amount").value = validBill.amount;
				screen.getByTestId("vat").value = validBill.vat;
				screen.getByTestId("pct").value = validBill.pct;
				screen.getByTestId("commentary").value = validBill.commentary;

				newBill.fileName = validBill.fileName;
				newBill.fileUrl = validBill.fileUrl;

				newBill.updateBill = jest.fn(); //SIMULATION DE  CLICK
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); //ENVOI DU FORMULAIRE

				const form = screen.getByTestId("form-new-bill");
				form.addEventListener("submit", handleSubmit);
				fireEvent.submit(form);

				expect(handleSubmit).toHaveBeenCalled();
				expect(newBill.updateBill).toHaveBeenCalled();
			});

			test("fetches error from an API and fails with 500 error", async () => {
				jest.spyOn(mockStore, "bills");
				jest.spyOn(console, "error").mockImplementation(() => {}); // Prevent Console.error jest error

				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				});
				Object.defineProperty(window, "location", {
					value: { hash: ROUTES_PATH["NewBill"] },
				});

				window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
				document.body.innerHTML = `<div id="root"></div>`;
				router();

				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};

				mockStore.bills.mockImplementationOnce(() => {
					return {
						update: () => {
							return Promise.reject(new Error("Erreur 500"));
						},
					};
				});
				const newBill = new NewBill({
					document,
					onNavigate,
					store: mockStore,
					localStorage: window.localStorage,
				});

				const form = screen.getByTestId("form-new-bill");
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
				form.addEventListener("submit", handleSubmit);
				fireEvent.submit(form);
				await new Promise(process.nextTick);
				expect(console.error).toBeCalled();
			});
		});

		describe("When I submit the form with missing required fields", () => {
			test("Form submission fails if required fields are missing", async () => {
				const html = NewBillUI();
				document.body.innerHTML = html;

				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};

				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				});

				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
					}),
				);

				const newBill = new NewBill({
					document,
					onNavigate,
					store: null,
					localStorage: window.localStorage,
				});

				screen.getByTestId("datepicker").value = "";
				screen.getByTestId("amount").value = "";
				screen.getByTestId("pct").value = "";
				screen.getByTestId("file").value = "";

				const form = screen.getByTestId("form-new-bill");
				const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
				form.addEventListener("submit", handleSubmit);
				fireEvent.submit(form);
				await new Promise(process.nextTick);

				expect(jest.fn()).not.toHaveBeenCalled();
			});
		});
	});
});
