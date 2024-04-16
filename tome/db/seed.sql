BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS tomes (
    id TEXT PRIMARY KEY,
    title TEXT,
    created TEXT,
    updated TEXT,
    user TEXT,
    body TEXT
);

INSERT INTO tomes (id, title, created, updated, user, body) VALUES
('abcdef', 'First Tome', '2024-04-12 12:00:00', '2024-04-12 12:00:00', 'a61688eec17b', 'In a time of enchantment when the moon played hide and seek with the stars, the mystical lands have awoken.'),
('defghi', 'Second Tome', '2024-04-13 14:15:00', '2024-04-13 14:15:00', '6e1f7633aae1', 'The ancient runes whispered tales of forgotten magic, painting images of sparkling fountains and palaces of precious stones.');

COMMIT;