const { openDb } = require('./db');
const createApp = require('./app');

const port = Number(process.env.PORT) || 8102;
const app = createApp(openDb());

// просроченные сессии удаляем раз в час
setInterval(() => app.locals.sessionStore.clearExpired(), 60 * 60 * 1000).unref();

// В Express 5 при ошибке запуска (например, порт занят) функция вызывается с ошибкой в первом аргументе
app.listen(port, (err) => {
  if (err) {
    if (err.code === 'EADDRINUSE') console.error(`Порт ${port} уже занят. Остановите другую программу или запустите на другом порту: set PORT=8110`);
    else console.error(err);
    process.exit(1);
  }
  console.log(`Портал запущен: http://localhost:${port}`);
});
