import Entity from './Entity';
import createRequest from './createRequest';

export default class ChatAPI extends Entity {
  async create(data) {
    return await createRequest('http://localhost:3000/new-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
}