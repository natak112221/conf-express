-- Практика 10: фотографии мероприятий (файлы лежат в public/img/events)
UPDATE events SET photo = 'neuro' WHERE title = 'Нейросети в школе: практика' AND photo IS NULL;
UPDATE events SET photo = 'opendata' WHERE title = 'Открытые данные Москвы' AND photo IS NULL;
UPDATE events SET photo = 'security' WHERE title = 'Кибербезопасность для малого бизнеса' AND photo IS NULL;
UPDATE events SET photo = 'design' WHERE title = 'Дизайн-системы без боли' AND photo IS NULL;
UPDATE events SET photo = 'testing' WHERE title = 'Тестирование: от чек-листа до CI' AND photo IS NULL;
UPDATE events SET photo = 'mobile' WHERE title = 'Мобильная разработка на Kotlin' AND photo IS NULL;
UPDATE events SET photo = 'db' WHERE title = 'Базы данных на практике' AND photo IS NULL;
UPDATE events SET photo = 'edtech' WHERE title = 'Разработчики в EdTech' AND photo IS NULL;
