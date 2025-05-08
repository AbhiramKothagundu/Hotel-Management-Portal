const token = localStorage.getItem("token");

let currentRooms = []; // Add this at the top to store rooms data globally

async function fetchDashboardStats() {
    const query = `
        query {
            rooms {
                id
                status
            }
            bookings {
                id
                status
                checkInDate
                checkOutDate
                adhaarProof
                user {
                    id
                    name
                    email
                }
                room {
                    id
                    roomNumber
                    type
                }
            }
        }
    `;

    try {
        const response = await fetch("/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query }),
        });

        const { data } = await response.json();

        // Update stats
        document.getElementById("totalRooms").textContent = data.rooms.length;
        document.getElementById("occupiedRooms").textContent =
            data.rooms.filter((room) => room.status === "occupied").length;
        document.getElementById("activeBookings").textContent =
            data.bookings.filter(
                (booking) => booking.status === "confirmed"
            ).length;

        // Render current bookings
        const currentBookings = data.bookings.filter(
            (b) => b.status === "confirmed"
        );
        console.log("Current bookings:", currentBookings); // Debug log
        renderCurrentBookings(currentBookings);
    } catch (error) {
        console.error("Error fetching stats:", error);
    }
}

function renderCurrentBookings(bookings) {
    const bookingsList = document.getElementById("currentBookingsList");
    if (!bookingsList) return;

    if (!bookings || bookings.length === 0) {
        bookingsList.innerHTML = "<p>No current bookings</p>";
        return;
    }

    console.log("Rendering bookings:", bookings); // Debug line

    bookingsList.innerHTML = bookings
        .map((booking) => {
            const userName = booking.user?.name || "Unknown User";
            const userEmail = booking.user?.email || "No email";
            const roomNumber = booking.room?.roomNumber || "Unknown Room";
            const roomType = booking.room?.type || "Unknown Type";
            const adhaarProof = booking.adhaarProof;

            console.log("Booking adhaarProof:", adhaarProof); // Debug line

            return `
                <div class="booking-card">
                    <h3>Room ${roomNumber}</h3>
                    <p>Room Type: ${roomType}</p>
                    <p>Guest: ${userName}</p>
                    <p>Email: ${userEmail}</p>
                    <p>Check-in: ${new Date(
                        parseInt(booking.checkInDate)
                    ).toLocaleDateString()}</p>
                    <p>Check-out: ${new Date(
                        parseInt(booking.checkOutDate)
                    ).toLocaleDateString()}</p>
                    <p>Status: ${booking.status}</p>
                    ${
                        adhaarProof
                            ? `<div class="adhaar-proof">
                            <h4>Aadhaar Proof</h4>
                            <img src="/uploads/${adhaarProof}" alt="Aadhaar Proof" style="max-width: 200px; display: block; margin: 10px 0;">
                            <a href="/uploads/${adhaarProof}" target="_blank">View Full Image</a>
                          </div>`
                            : "<p>No Aadhaar proof provided</p>"
                    }
                </div>
            `;
        })
        .join("");
}

async function fetchRooms() {
    const query = `
        query {
            rooms {
                id
                roomNumber
                type
                price
                status
                description
            }
        }
    `;

    try {
        const response = await fetch("/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query }),
        });

        const { data } = await response.json();
        currentRooms = data.rooms; // Store rooms data globally
        renderRooms(data.rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
    }
}

function renderRoomStatusBadge(status) {
    const colors = {
        available: "green",
        occupied: "red",
        maintenance: "orange",
    };
    return `<span class="status-badge ${colors[status]}">${status}</span>`;
}

function renderRooms(rooms) {
    const roomsList = document.getElementById("roomsList");
    roomsList.innerHTML = rooms
        .map(
            (room) => `
        <div class="room-card">
            <h3>Room ${room.roomNumber}</h3>
            <p>Type: ${room.type}</p>
            <p>Price: $${room.price}</p>
            <p>Status: ${renderRoomStatusBadge(room.status)}</p>
            <p>Description: ${room.description || "No description"}</p>
            <div class="room-actions">
                <button onclick="updateRoom('${room.id}')">Edit</button>
                <button onclick="deleteRoom('${
                    room.id
                }')" class="delete-btn">Delete</button>
            </div>
        </div>
    `
        )
        .join("");
}

async function addRoom(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const mutation = `
        mutation AddRoom($roomNumber: String!, $type: String!, $price: Float!, $description: String) {
            addRoom(roomNumber: $roomNumber, type: $type, price: $price, description: $description) {
                id
            }
        }
    `;

    try {
        const response = await fetch("/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: mutation,
                variables: {
                    roomNumber: formData.get("roomNumber"),
                    type: formData.get("type"),
                    price: parseFloat(formData.get("price")),
                    description: formData.get("description"),
                },
            }),
        });

        const { data, errors } = await response.json();
        if (errors) {
            alert(errors[0].message);
            return;
        }

        alert("Room added successfully!");
        event.target.reset();
        fetchRooms();
    } catch (error) {
        alert("Failed to add room. Please try again.");
    }
}

async function updateRoom(roomId) {
    const room = currentRooms.find((r) => r.id === roomId);
    if (!room) {
        alert("Room not found!");
        return;
    }

    // Create a modal or form for editing
    const form = document.createElement("form");
    form.innerHTML = `
        <div class="edit-form">
            <h3>Edit Room ${room.roomNumber}</h3>
            <input type="text" id="editType" value="${
                room.type
            }" placeholder="Room Type">
            <input type="number" id="editPrice" value="${
                room.price
            }" placeholder="Price">
            <select id="editStatus">
                <option value="available" ${
                    room.status === "available" ? "selected" : ""
                }>Available</option>
                <option value="occupied" ${
                    room.status === "occupied" ? "selected" : ""
                }>Occupied</option>
                <option value="maintenance" ${
                    room.status === "maintenance" ? "selected" : ""
                }>Maintenance</option>
            </select>
            <textarea id="editDescription" placeholder="Description">${
                room.description || ""
            }</textarea>
            <button type="submit">Save Changes</button>
            <button type="button" onclick="this.parentElement.remove()">Cancel</button>
        </div>
    `;

    document.body.appendChild(form);

    form.onsubmit = async (e) => {
        e.preventDefault();

        const mutation = `
            mutation UpdateRoom($id: ID!, $type: String!, $price: Float!, $status: RoomStatus!, $description: String) {
                updateRoom(
                    id: $id,
                    type: $type,
                    price: $price,
                    status: $status,
                    description: $description
                ) {
                    id
                    roomNumber
                    type
                    price
                    status
                    description
                }
            }
        `;

        try {
            const response = await fetch("/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        id: roomId,
                        type: document.getElementById("editType").value,
                        price: parseFloat(
                            document.getElementById("editPrice").value
                        ),
                        status: document.getElementById("editStatus").value,
                        description:
                            document.getElementById("editDescription").value,
                    },
                }),
            });

            const { data, errors } = await response.json();
            if (errors) {
                throw new Error(errors[0].message);
            }

            alert("Room updated successfully!");
            form.remove();
            fetchRooms();
        } catch (error) {
            alert("Failed to update room: " + error.message);
        }
    };
}

async function deleteRoom(roomId) {
    if (!confirm("Are you sure you want to delete this room?")) return;

    const mutation = `
        mutation DeleteRoom($id: ID!) {
            deleteRoom(id: $id)
        }
    `;

    try {
        await fetch("/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: mutation,
                variables: { id: roomId },
            }),
        });

        alert("Room deleted successfully!");
        fetchRooms();
    } catch (error) {
        alert("Failed to delete room. Please try again.");
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}

// Initialize dashboard
document.getElementById("addRoomForm").addEventListener("submit", addRoom);
fetchDashboardStats();
fetchRooms();
