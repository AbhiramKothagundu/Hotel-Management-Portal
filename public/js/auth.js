const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);

    const query = `
        mutation LoginUser($email: String!, $password: String!) {
            loginUser(email: $email, password: $password)
        }
    `;

    try {
        console.log("Attempting login..."); // Debug log
        const response = await fetch("/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query,
                variables: {
                    email: formData.get("email"),
                    password: formData.get("password"),
                },
            }),
        });

        const result = await response.json();
        console.log("Login response:", result); // Debug log

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        if (result.data?.loginUser) {
            const token = result.data.loginUser;
            localStorage.setItem("token", token);

            // Decode token to get user info
            const payload = JSON.parse(atob(token.split(".")[1]));
            localStorage.setItem("user", JSON.stringify(payload));

            // Set token in cookie
            document.cookie = `token=${token}; path=/; max-age=86400`;

            // Set headers for future requests
            document.defaultHeaders = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            // Redirect based on role with token in URL
            const redirectUrl =
                payload.role === "admin"
                    ? `/admin/dashboard?token=${token}`
                    : `/user/dashboard?token=${token}`;

            window.location.href = redirectUrl;
        } else {
            throw new Error("Login failed - No token received");
        }
    } catch (err) {
        console.error("Login error:", err); // Debug log
        alert(`Login failed: ${err.message}`);
    }
});
