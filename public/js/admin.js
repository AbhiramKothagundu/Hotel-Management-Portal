const token = localStorage.getItem("token");

async function fetchStats() {
    const query = `
        query {
            rooms { id }
            bookings { id status }
        }
    `;

    const response = await fetch("/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    document.getElementById("totalRooms").textContent = data.rooms.length;
    document.getElementById("activeBookings").textContent =
        data.bookings.filter((b) => b.status === "confirmed").length;
}

async function handleRoomManagement() {
    const roomsContainer = document.getElementById("roomsList");
    const query = `
        query {
            rooms {
                id
                roomNumber
                type
                price
                status
            }
        }
    `;

    const response = await fetch("/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    renderRooms(data.rooms);
}

fetchStats();
handleRoomManagement();
