const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { mapDBToModelSong, mapDBToModelSongDetail } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = `song-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Song failed to be added');
    }
    return result.rows[0].id;
  }

  async getSongs(title, performer) {
    let text = 'SELECT id, title, performer FROM songs';
    const values = [];

    if (title) {
      text += ' WHERE title ILIKE \'%\' || $1 || \'%\'';
      values.push(title);
    }

    if (title && performer) {
      text += ' AND performer ILIKE \'%\' || $2 || \'%\'';
      values.push(performer);
    }

    if (!title && performer) {
      text += ' WHERE performer ILIKE \'%\' || $1 || \'%\'';
      values.push(performer);
    }

    const query = {
      text,
      values,
    };
    const result = await this._pool.query(query);
    return result.rows.map(mapDBToModelSong);
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Song not found');
    }
    return mapDBToModelSongDetail(result.rows[0]);
  }

  async editSongById(id, {
    title, year, genre, performer, duration, albumId,
  }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, "albumId" = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Failed to update song. Id not found');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete song. Id not found');
    }
  }
}

module.exports = SongService;
