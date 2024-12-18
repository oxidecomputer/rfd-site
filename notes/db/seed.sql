BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT,
    created TEXT,
    updated TEXT,
    user TEXT,
    body TEXT,
    published BOOLEAN
);

INSERT INTO notes (id, title, created, updated, user, body, published) VALUES
('AoGfVy', 'First Note', '2024-04-12 12:00:00', '2024-04-12 12:00:00', '96861ac2-f56e-4b7d-b128-c04467e6dd5f', 'In a time of enchantment when the moon played hide and seek with the stars, the mystical lands have awoken.', TRUE),
('Z5dQt1', 'Second Note', '2024-04-13 14:15:00', '2024-04-13 14:15:00', '96861ac2-f56e-4b7d-b128-c04467e6dd5f', 'The ancient runes whispered tales of forgotten magic, painting images of sparkling fountains and palaces of precious stones.', FALSE);

COMMIT;