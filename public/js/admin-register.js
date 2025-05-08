const adminRegisterForm = document.getElementById("adminRegisterForm");

adminRegisterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(adminRegisterForm);

    const query = `
        mutation RegisterAdmin($name: String!, $email: String!, $password: String!, $adminCode: String!) {
            registerAdmin(name: $name, email: $email, password: $password, adminCode: $adminCode) {
                id
                name
                email
                role
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
                    adminCode: formData.get("adminCode"),
                },
            }),
        });

        const { data, errors } = await response.json();
        if (data?.registerAdmin) {
            alert("Admin registration successful! Please login.");
            window.location.href = "/";
        } else {
            alert(errors?.[0]?.message || "Registration failed");
        }
    } catch (err) {
        alert("Registration failed. Please try again.");
    }
});
