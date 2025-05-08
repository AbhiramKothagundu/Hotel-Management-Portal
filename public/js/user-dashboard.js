const token = localStorage.getItem("token");

async function fetchAvailableRooms() {
    const query = `
        query {
            availableRooms {
                id
                roomNumber
                type
                price
                description
                status
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

        const { data, errors } = await response.json();

        if (errors) {
            console.error("GraphQL Errors:", errors);
            throw new Error(errors[0].message);
        }

        if (!data || !data.availableRooms) {
            throw new Error("No available rooms data received");
        }

        renderAvailableRooms(data.availableRooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        const roomsList = document.getElementById("roomsList");
        roomsList.innerHTML = `<p class="error-message">Error loading available rooms: ${error.message}</p>`;
    }
}

async function fetchMyBookings() {
    const query = `
        query {
            myBookings {
                id
                checkInDate
                checkOutDate
                status
                room {
                    id
                    roomNumber
                    type
                    price
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
        renderMyBookings(data.myBookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
    }
}

function renderAvailableRooms(rooms) {
    const roomsList = document.getElementById("roomsList");
    if (!roomsList) {
        console.error("roomsList element not found");
        return;
    }

    if (!Array.isArray(rooms)) {
        roomsList.innerHTML = '<p class="error-message">No rooms available</p>';
        return;
    }

    if (rooms.length === 0) {
        roomsList.innerHTML =
            '<p class="no-rooms-message">No rooms available at the moment</p>';
        return;
    }

    roomsList.innerHTML = rooms
        .map(
            (room) => `
        <div class="room-card">
            <h3>Room ${room.roomNumber}</h3>
            <p>Type: ${room.type}</p>
            <p>Price: $${room.price}</p>
            <p>Description: ${
                room.description || "No description available"
            }</p>
            <button onclick="bookRoom('${
                room.id
            }')" class="book-button">Book Now</button>
        </div>
    `
        )
        .join("");
}

function renderMyBookings(bookings) {
    const bookingsList = document.getElementById("myBookingsList");
    if (!bookingsList) {
        console.error("bookingsList element not found");
        return;
    }

    if (!Array.isArray(bookings)) {
        bookingsList.innerHTML =
            '<p class="error-message">No bookings found</p>';
        return;
    }

    if (bookings.length === 0) {
        bookingsList.innerHTML =
            '<p class="no-bookings-message">You have no bookings yet</p>';
        return;
    }

    bookingsList.innerHTML = bookings
        .map((booking) => {
            // Check if room data exists
            if (!booking.room) {
                console.error("Missing room data for booking:", booking.id);
            }

            const checkInDate = new Date(
                booking.checkInDate
            ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const checkOutDate = new Date(
                booking.checkOutDate
            ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            return `
                <div class="booking-card">
                    <h3>Room ${
                        booking.room ? booking.room.roomNumber : "N/A"
                    }</h3>
                    <p>Type: ${booking.room ? booking.room.type : "N/A"}</p>
                    <p>Check-in: ${checkInDate}</p>
                    <p>Check-out: ${checkOutDate}</p>
                    <p>Status: ${booking.status}</p>
                    ${
                        booking.status === "confirmed"
                            ? `<button onclick="cancelBooking('${booking.id}')" class="cancel-btn">Cancel Booking</button>`
                            : ""
                    }
                </div>
            `;
        })
        .join("");
}

async function bookRoom(roomId) {
    const form = document.createElement("form");
    form.innerHTML = `
        <div class="booking-form">
            <h3>Book Room</h3>
            <input type="date" id="checkInDate" required>
            <input type="date" id="checkOutDate" required>
            <input type="file" id="adhaarProof" accept="image/*" required>
            <button type="submit">Book Now</button>
            <button type="button" onclick="this.parentElement.remove()">Cancel</button>
        </div>
    `;

    document.body.appendChild(form);

    form.onsubmit = async (e) => {
        e.preventDefault();

        // First upload the file
        const fileInput = document.getElementById("adhaarProof");
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        try {
            // Upload file first
            const uploadResponse = await fetch("/graphql/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const { filename } = await uploadResponse.json();

            // Then create the booking
            const bookingResponse = await fetch("/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation BookRoom($roomId: ID!, $checkInDate: String!, $checkOutDate: String!, $adhaarProof: String!) {
                            bookRoom(roomId: $roomId, checkInDate: $checkInDate, checkOutDate: $checkOutDate, adhaarProof: $adhaarProof) {
                                id
                                status
                                room {
                                    roomNumber
                                }
                            }
                        }
                    `,
                    variables: {
                        roomId,
                        checkInDate:
                            document.getElementById("checkInDate").value,
                        checkOutDate:
                            document.getElementById("checkOutDate").value,
                        adhaarProof: filename,
                    },
                }),
            });

            const { data, errors } = await bookingResponse.json();

            if (errors) {
                throw new Error(errors[0].message);
            }

            alert(
                `Booking successful! Room ${data.bookRoom.room.roomNumber} is reserved for you.`
            );
            form.remove();
            await fetchAvailableRooms();
            await fetchMyBookings();
        } catch (error) {
            alert(`Failed to book room: ${error.message}`);
        }
    };
}

async function cancelBooking(bookingId) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    const mutation = `
        mutation CancelBooking($id: ID!) {
            cancelBooking(id: $id)
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
                variables: { id: bookingId },
            }),
        });

        const { data, errors } = await response.json();
        if (errors) {
            alert(errors[0].message);
            return;
        }

        alert("Booking cancelled successfully!");
        await fetchMyBookings();
        await fetchAvailableRooms(); // Refresh available rooms list
    } catch (error) {
        alert("Failed to cancel booking. Please try again.");
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}

// Initialize dashboard
fetchAvailableRooms();
fetchMyBookings();
