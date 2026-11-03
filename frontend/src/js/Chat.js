import ChatAPI from './api/ChatAPI';

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
    this.user = null;
  }

  init() {
    this.bindToDOM();
    this.registerEvents();
    this.showModal();
  }

  bindToDOM() {
    this.container.innerHTML = `
      <div class="modal__form active" id="modal-login">
        <div class="modal__background"></div>
        <div class="modal__content">
          <div class="modal__header">Выберите никнейм</div>
          <div class="modal__body">
            <form class="form" id="login-form">
              <div class="form__group">
                <input type="text" class="form__input" id="nickname" placeholder="Введите ваш никнейм" required autocomplete="off">
              </div>
              <div class="form__hint hidden" id="login-error">Этот никнейм уже занят, выберите другой.</div>
            </form>
          </div>
          <div class="modal__footer">
            <button type="submit" form="login-form" class="modal__ok">Войти</button>
          </div>
        </div>
      </div>

      <div class="container hidden" id="chat-container">
        <h1 class="chat__header">Чат</h1>
        <div class="chat__container">
          <div class="chat__area">
            <div class="chat__messages-container" id="messages"></div>
            <div class="chat__messages-input">
              <form class="form" id="message-form">
                <div class="form__group">
                  <input type="text" class="form__input" id="message-input" placeholder="Введите сообщение" required autocomplete="off">
                </div>
              </form>
            </div>
          </div>
          <div class="chat__userlist" id="user-list"></div>
        </div>
      </div>
    `;

    this.modal = this.container.querySelector('#modal-login');
    this.chatContainer = this.container.querySelector('#chat-container');
    this.loginForm = this.container.querySelector('#login-form');
    this.nicknameInput = this.container.querySelector('#nickname');
    this.loginError = this.container.querySelector('#login-error');
    this.messagesContainer = this.container.querySelector('#messages');
    this.messageForm = this.container.querySelector('#message-form');
    this.messageInput = this.container.querySelector('#message-input');
    this.userList = this.container.querySelector('#user-list');
  }

  registerEvents() {
    this.loginForm.addEventListener('submit', (e) => this.onEnterChatHandler(e));

    this.messageForm.addEventListener('submit', (e) => this.sendMessage(e));

    // Отключение пользователя при закрытии вкладки
    window.addEventListener('beforeunload', () => {
      if (this.websocket && this.user) {
        this.websocket.send(JSON.stringify({
          type: 'exit',
          user: this.user,
        }));
      }
    });
  }

  async onEnterChatHandler(e) {
    e.preventDefault();
    const name = this.nicknameInput.value.trim();
    if (!name) return;

    try {
      this.loginError.classList.add('hidden');
      const response = await this.api.create({ name });
      
      if (response.status === 'ok') {
        this.user = response.user;
        this.showChat();
        this.connectWebSocket();
      }
    } catch (error) {
      // Если никнейм занят, показываем ошибку
      this.loginError.classList.remove('hidden');
    }
  }

  showModal() {
    this.modal.classList.add('active');
    this.nicknameInput.focus();
  }

  showChat() {
    this.modal.classList.remove('active');
    this.chatContainer.classList.remove('hidden');
    this.messageInput.focus();
  }

  connectWebSocket() {
    this.websocket = new WebSocket('ws://localhost:3000');

    this.websocket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);

      if (Array.isArray(data)) {
        this.renderUserList(data);
      } 

      else if (data.type === 'send') {
        this.renderMessage(data);
      }
    });

    this.websocket.addEventListener('error', () => {
      console.error('WebSocket error');
      alert('Ошибка подключения к чату');
    });
  }

  sendMessage(e) {
    e.preventDefault();
    const message = this.messageInput.value.trim();
    if (!message || this.websocket.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'send',
      message: message,
      user: this.user,
    };

    this.websocket.send(JSON.stringify(payload));
    this.messageInput.value = '';
  }

  renderMessage(data) {
    const { user, message } = data;
    const isSelf = user.id === this.user.id;

    const msgContainer = document.createElement('div');
    msgContainer.classList.add('message__container');
    msgContainer.classList.add(
      isSelf ? 'message__container-yourself' : 'message__container-interlocutor'
    );

    const senderName = isSelf ? 'You' : user.name;

    msgContainer.innerHTML = `
      <div class="message__header">${senderName}</div>
      <div class="message__text">${message}</div>
    `;

    this.messagesContainer.appendChild(msgContainer);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  renderUserList(users) {
    this.userList.innerHTML = '';
    users.forEach((user) => {
      const userEl = document.createElement('div');
      userEl.classList.add('chat__user');
      userEl.textContent = user.id === this.user.id ? `${user.name} (You)` : user.name;
      this.userList.appendChild(userEl);
    });
  }
}
