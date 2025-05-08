const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);

    const query = `
        mutation RegisterUser($name: String!, $email: String!, $password: String!) {
            registerUser(name: $name, email: $email, password: $password) {
                id
                name
                email
            }
        }
    `;

    try {
        const response = await fetch("/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query,
                variables: {
                    name: formData.get("name"),
                    email: formData.get("email"),
                    password: formData.get("password"),
                },
            }),
        });

        const { data, errors } = await response.json();
        if (data?.registerUser) {
            alert("Registration successful! Please login.");
            window.location.href = "/";
        } else {
            alert(errors?.[0]?.message || "Registration failed");
        }
    } catch (err) {
        alert("Registration failed. Please try again.");
    }
});
