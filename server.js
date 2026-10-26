require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'development_only_change_me';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vehicle_service_db',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

function createToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please log in first.' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Session expired. Please log in again.' }); }
}
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  next();
}
function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Vehicle Service API is running' }));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required.' });
  if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
  if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' });
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
    [String(name).trim(), String(email).trim().toLowerCase(), hash, phone || null, 'customer']
  );
  const user = { id: result.insertId, name: String(name).trim(), email: String(email).trim().toLowerCase(), role: 'customer' };
  res.status(201).json({ token: createToken(user), user });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  const [rows] = await pool.execute('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role };
  res.json({ token: createToken(user), user });
}));

app.get('/api/services', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT id, name, description, price, duration_minutes FROM services WHERE active = 1 ORDER BY name');
  res.json(rows);
}));

app.get('/api/vehicles', auth, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT id, make, model, registration_number, vehicle_type, year FROM vehicles WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
  res.json(rows);
}));
app.post('/api/vehicles', auth, asyncRoute(async (req, res) => {
  const { make, model, registration_number, vehicle_type, year } = req.body;
  if (!make || !model || !registration_number) return res.status(400).json({ message: 'Make, model and registration number are required.' });
  const [result] = await pool.execute(
    'INSERT INTO vehicles (user_id, make, model, registration_number, vehicle_type, year) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, make.trim(), model.trim(), registration_number.trim().toUpperCase(), vehicle_type || 'Car', year || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Vehicle added successfully.' });
}));
app.delete('/api/vehicles/:id', auth, asyncRoute(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Vehicle not found.' });
  res.json({ message: 'Vehicle deleted.' });
}));

app.get('/api/bookings', auth, asyncRoute(async (req, res) => {
  let sql = `SELECT b.id, b.mechanic_id, b.booking_date, b.booking_time, b.status, b.notes, b.total_amount, b.payment_status,
    v.make, v.model, v.registration_number, s.name AS service_name, m.name AS mechanic_name
    FROM bookings b JOIN vehicles v ON b.vehicle_id=v.id JOIN services s ON b.service_id=s.id
    LEFT JOIN mechanics m ON b.mechanic_id=m.id`;
  const params = [];
  if (req.user.role !== 'admin') { sql += ' WHERE b.user_id = ?'; params.push(req.user.id); }
  sql += ' ORDER BY b.booking_date DESC, b.booking_time DESC';
  const [rows] = await pool.execute(sql, params);
  res.json(rows);
}));

app.post('/api/bookings', auth, asyncRoute(async (req, res) => {
  const { vehicle_id, service_id, booking_date, booking_time, notes } = req.body;
  if (!vehicle_id || !service_id || !booking_date || !booking_time) {
    return res.status(400).json({ message: 'Vehicle, service, date and time are required.' });
  }
  const requestedDate = new Date(`${booking_date}T${booking_time}:00`);
  if (Number.isNaN(requestedDate.getTime()) || requestedDate < new Date(Date.now() - 60000)) {
    return res.status(400).json({ message: 'Choose a future appointment date and time.' });
  }
  const [vehicle] = await pool.execute('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [vehicle_id, req.user.id]);
  if (!vehicle.length) return res.status(403).json({ message: 'Choose one of your own vehicles.' });
  const [services] = await pool.execute('SELECT id, price FROM services WHERE id = ? AND active = 1', [service_id]);
  if (!services.length) return res.status(400).json({ message: 'Selected service is unavailable.' });
  const [conflicts] = await pool.execute(
    `SELECT id FROM bookings WHERE booking_date = ? AND booking_time = ?
     AND status NOT IN ('Cancelled', 'Rejected')`,
    [booking_date, booking_time]
  );
  if (conflicts.length) return res.status(409).json({ message: 'That time slot is already booked. Please choose another time.' });
  const [result] = await pool.execute(
    `INSERT INTO bookings (user_id, vehicle_id, service_id, booking_date, booking_time, notes, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, vehicle_id, service_id, booking_date, booking_time, notes || null, services[0].price]
  );
  res.status(201).json({ id: result.insertId, message: 'Booking submitted successfully.' });
}));

app.patch('/api/bookings/:id/cancel', auth, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT id, user_id, status FROM bookings WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) return res.status(403).json({ message: 'You cannot cancel this booking.' });
  if (!['Pending', 'Confirmed'].includes(rows[0].status)) return res.status(400).json({ message: 'Only pending or confirmed bookings can be cancelled.' });
  await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', ['Cancelled', req.params.id]);
  res.json({ message: 'Booking cancelled.' });
}));

app.patch('/api/bookings/:id/status', auth, adminOnly, asyncRoute(async (req, res) => {
  const allowed = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Rejected', 'Cancelled'];
  const { status, mechanic_id, payment_status } = req.body;
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid booking status.' });
  const [rows] = await pool.execute('SELECT id FROM bookings WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
  await pool.execute(
    'UPDATE bookings SET status = ?, mechanic_id = ?, payment_status = COALESCE(?, payment_status) WHERE id = ?',
    [status, mechanic_id || null, payment_status || null, req.params.id]
  );
  res.json({ message: 'Booking updated.' });
}));

app.get('/api/mechanics', auth, adminOnly, asyncRoute(async (req, res) => {
  const [rows] = await pool.execute('SELECT id, name, phone, specialization FROM mechanics WHERE active = 1 ORDER BY name');
  res.json(rows);
}));

app.get('/api/admin/summary', auth, adminOnly, asyncRoute(async (req, res) => {
  const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM bookings');
  const [[{ pending }]] = await pool.execute("SELECT COUNT(*) AS pending FROM bookings WHERE status = 'Pending'");
  const [[{ progress }]] = await pool.execute("SELECT COUNT(*) AS progress FROM bookings WHERE status = 'In Progress'");
  const [[{ completed }]] = await pool.execute("SELECT COUNT(*) AS completed FROM bookings WHERE status = 'Completed'");
  res.json({ total, pending, progress, completed });
}));

app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A record with that value already exists.' });
  res.status(500).json({ message: 'Server error. Check the server console and database configuration.' });
});

app.listen(PORT, () => console.log(`Vehicle Service app running at http://localhost:${PORT}`));
