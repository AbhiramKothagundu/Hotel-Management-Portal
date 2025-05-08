const token = localStorage.getItem("token");

async function fetchAvailableRooms() {
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

    const response = await fetch("/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    const availableRooms = data.rooms.filter(
        (room) => room.status === "available"
    );
    const roomList = document.getElementById("roomList");

    roomList.innerHTML = availableRooms
        .map(
            (room) => `
        <div class="room-card">
            <h3>Room ${room.roomNumber}</h3>
            <p>Type: ${room.type}</p>
            <p>Price: $${room.price}</p>
            <button onclick="bookRoom('${room.id}')">Book Now</button>
        </div>
    `
        )
        .join("");
}

async function bookRoom(roomId) {
    const checkInDate = prompt("Enter check-in date (YYYY-MM-DD):");
    const checkOutDate = prompt("Enter check-out date (YYYY-MM-DD):");

    const mutation = `
        mutation BookRoom($roomId: ID!, $checkInDate: String!, $checkOutDate: String!) {
            bookRoom(
                roomId: $roomId,
                checkInDate: $checkInDate,
                checkOutDate: $checkOutDate
            ) {
                id
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
            body: JSON.stringify({
                query: mutation,
                variables: { roomId, checkInDate, checkOutDate },
            }),
        });

        const { data } = await response.json();
        if (data.bookRoom) {
            alert("Booking successful!");
            fetchAvailableRooms();
        }
    } catch (err) {
        alert("Booking failed. Please try again.");
    }
}

fetchAvailableRooms();
