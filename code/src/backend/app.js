const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory data store (for demo purposes)
let users = [
    { id: 1, name: 'Jean Dupont', email: 'jean.dupont@example.com', pin: '1234', active: true },
    { id: 2, name: 'Marie Martin', email: 'marie.martin@example.com', pin: '5678', active: true },
    { id: 3, name: 'Pierre Bernard', email: 'pierre.bernard@example.com', pin: '9012', active: false }
];

let attendanceRecords = [
    { id: 1, userId: 1, type: 'arrival', timestamp: new Date('2025-12-01T08:00:00') },
    { id: 2, userId: 1, type: 'departure', timestamp: new Date('2025-12-01T12:00:00') },
    { id: 3, userId: 2, type: 'arrival', timestamp: new Date('2025-12-01T09:00:00') },
    { id: 4, userId: 1, type: 'arrival', timestamp: new Date('2025-12-01T13:00:00') },
    { id: 5, userId: 2, type: 'departure', timestamp: new Date('2025-12-01T17:00:00') }
];

let nextUserId = 4;
let nextAttendanceId = 6;

// API Routes

// Get all users
app.get('/api/users', (req, res) => {
    res.json(users);
});

// Get a single user
app.get('/api/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id, 10));
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});

// Helper function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Create a new user
app.post('/api/users', (req, res) => {
    const { name, email, pin } = req.body;
    
    if (!name || !email || !pin) {
        return res.status(400).json({ error: 'Name, email, and PIN are required' });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
    
    // Check for duplicate email
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Check for duplicate PIN
    if (users.some(u => u.pin === pin)) {
        return res.status(400).json({ error: 'PIN already in use' });
    }
    
    const newUser = {
        id: nextUserId++,
        name,
        email,
        pin,
        active: true
    };
    
    users.push(newUser);
    res.status(201).json(newUser);
});

// Update a user
app.put('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const { name, email, pin, active } = req.body;
    
    // Validate email format if provided
    if (email && !isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (pin && (pin.length !== 4 || !/^\d+$/.test(pin))) {
        return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
    
    // Check for duplicate email (excluding current user)
    if (email && users.some(u => u.id !== userId && u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Check for duplicate PIN (excluding current user)
    if (pin && users.some(u => u.id !== userId && u.pin === pin)) {
        return res.status(400).json({ error: 'PIN already in use' });
    }
    
    users[userIndex] = {
        ...users[userIndex],
        name: name || users[userIndex].name,
        email: email || users[userIndex].email,
        pin: pin || users[userIndex].pin,
        active: active !== undefined ? active : users[userIndex].active
    };
    
    res.json(users[userIndex]);
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    res.status(204).send();
});

// Get all attendance records
app.get('/api/attendance', (req, res) => {
    const { userId } = req.query;
    let records = attendanceRecords;
    
    if (userId) {
        records = records.filter(r => r.userId === parseInt(userId, 10));
    }
    
    // Enrich with user info
    const enrichedRecords = records.map(record => {
        const user = users.find(u => u.id === record.userId);
        return {
            ...record,
            userName: user ? user.name : 'Unknown User'
        };
    });
    
    res.json(enrichedRecords);
});

// Verify PIN and record attendance
app.post('/api/attendance/verify', (req, res) => {
    const { pin } = req.body;
    
    if (!pin) {
        return res.status(400).json({ success: false, error: 'PIN is required' });
    }
    
    const user = users.find(u => u.pin === pin && u.active);
    
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid PIN' });
    }
    
    // Get last attendance record for this user
    const userRecords = attendanceRecords.filter(r => r.userId === user.id);
    const lastRecord = userRecords.length > 0 
        ? userRecords.reduce((latest, r) => r.timestamp > latest.timestamp ? r : latest)
        : null;
    
    // Toggle between arrival and departure
    const type = !lastRecord || lastRecord.type === 'departure' ? 'arrival' : 'departure';
    
    const newRecord = {
        id: nextAttendanceId++,
        userId: user.id,
        type,
        timestamp: new Date()
    };
    
    attendanceRecords.push(newRecord);
    
    res.json({ 
        success: true, 
        userName: user.name,
        type,
        timestamp: newRecord.timestamp
    });
});

// Serve the admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// Serve the user interface (PIN entry)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`User interface: http://localhost:${PORT}/`);
});
