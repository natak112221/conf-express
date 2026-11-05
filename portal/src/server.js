const { openDb } = require('./db');
const createApp = require('./app');

const port = Number(process.env.PORT) || 8102;
const app = createApp(openDb());
app.listen(port, () => console.log(`Портал запущен: http://localhost:${port}`));
