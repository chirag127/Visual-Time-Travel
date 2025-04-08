/**
 * Login component module
 * Handles login and registration UI
 * @module components/login
 */

import { login, register } from "../utils/api.js";
import { saveAuth } from "../utils/auth.js";

/**
 * Initialize login component
 * @param {Function} onLoginSuccess - Callback function to call on successful login
 */
export function initLoginComponent(onLoginSuccess) {
    console.log("Initializing login component");
    // Get form elements
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");
    const loginPanel = document.getElementById("login-panel");
    const registerPanel = document.getElementById("register-panel");
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");

    // Show login panel by default
    showLoginPanel();

    // Add event listeners for tab switching
    loginTab.addEventListener("click", showLoginPanel);
    registerTab.addEventListener("click", showRegisterPanel);

    // Add event listeners for form submission
    loginForm.addEventListener("submit", handleLogin);
    registerForm.addEventListener("submit", handleRegister);

    /**
     * Show login panel
     */
    function showLoginPanel() {
        loginPanel.classList.add("active");
        registerPanel.classList.remove("active");
        loginTab.classList.add("active");
        registerTab.classList.remove("active");
    }

    /**
     * Show register panel
     */
    function showRegisterPanel() {
        registerPanel.classList.add("active");
        loginPanel.classList.remove("active");
        registerTab.classList.add("active");
        loginTab.classList.remove("active");
    }

    /**
     * Handle login form submission
     * @param {Event} event - Form submission event
     */
    async function handleLogin(event) {
        event.preventDefault();
        console.log("Login form submitted");

        // Get form data
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        console.log(`Attempting to login with email: ${email}`);

        // Clear previous error
        loginError.textContent = "";
        loginError.style.display = "block";

        try {
            // Disable form
            setFormDisabled(loginForm, true);

            // Login user
            console.log("Calling login API...");
            const response = await login(email, password);
            console.log("Login API response:", response);

            // Save auth data
            await saveAuth({
                token: response.data.token,
                user: response.data.user,
            });

            console.log("Auth data saved, calling success callback");
            // Call success callback
            onLoginSuccess();
        } catch (error) {
            console.error("Login error:", error);
            // Show error
            loginError.textContent = error.message || "Login failed";
            loginError.style.display = "block";
        } finally {
            // Enable form
            setFormDisabled(loginForm, false);
        }
    }

    /**
     * Handle register form submission
     * @param {Event} event - Form submission event
     */
    async function handleRegister(event) {
        event.preventDefault();
        console.log("Register form submitted");

        // Get form data
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById(
            "register-confirm-password"
        ).value;

        console.log(`Attempting to register with email: ${email}`);

        // Clear previous error
        registerError.textContent = "";
        registerError.style.display = "block";

        // Validate passwords match
        if (password !== confirmPassword) {
            registerError.textContent = "Passwords do not match";
            return;
        }

        try {
            // Disable form
            setFormDisabled(registerForm, true);

            // Register user
            console.log("Calling register API...");
            const response = await register(email, password);
            console.log("Register API response:", response);

            // Save auth data
            await saveAuth({
                token: response.data.token,
                user: response.data.user,
            });

            console.log("Auth data saved, calling success callback");
            // Call success callback
            onLoginSuccess();
        } catch (error) {
            console.error("Registration error:", error);
            // Show error
            registerError.textContent = error.message || "Registration failed";
            registerError.style.display = "block";
        } finally {
            // Enable form
            setFormDisabled(registerForm, false);
        }
    }

    /**
     * Set form disabled state
     * @param {HTMLFormElement} form - Form element
     * @param {boolean} disabled - Whether to disable the form
     */
    function setFormDisabled(form, disabled) {
        // Get all form elements
        const elements = form.elements;

        // Set disabled state for each element
        for (let i = 0; i < elements.length; i++) {
            elements[i].disabled = disabled;
        }
    }
}
