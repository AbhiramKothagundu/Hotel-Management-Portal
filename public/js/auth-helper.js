// Add this new file to handle authenticated requests
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}

async function authenticatedFetch(url, options = {}) {
    const headers = getAuthHeaders();
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
        throw new Error("Authentication failed");
    }

    return response;
}
