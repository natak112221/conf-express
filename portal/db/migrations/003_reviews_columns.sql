-- Практика 9: отзыв пока хранится прямо в заявке
ALTER TABLE applications ADD COLUMN review_text TEXT;
ALTER TABLE applications ADD COLUMN review_rating INTEGER;
ALTER TABLE applications ADD COLUMN reviewed_at TEXT;
