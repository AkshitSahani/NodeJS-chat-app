const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
// const $locations = document.querySelector('#locations');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// utility functions
const getFormattedTime = (time) => moment(time).format('h:mm a');

// options
const {username, room} = Qs.parse(window.location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageMargin = parseInt(getComputedStyle($newMessage).marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight;
  }
}

document.querySelector('#message-form').addEventListener('submit', (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute('disabled', 'disabled');
  const message = e.target.elements.message.value;
  socket.emit('sendMessage', message, (err) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if(err){
      return console.log(err);
    }
    console.log('message was delivered');
  });
})

socket.on('message', ({text, createdAt, username}) => {
  const html = Mustache.render(messageTemplate, {
    message: text, 
    createdAt: getFormattedTime(createdAt),
    username,
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
})

socket.on('locationMessage', ({href, createdAt, username}) => {
  const html = Mustache.render(locationTemplate, {
    href,
    createdAt: getFormattedTime(createdAt),
    username,
  });
  $messages.insertAdjacentHTML('beforeend', html);
})

socket.on('roomData', ({room, users}) => {

  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  })
  document.querySelector('.chat__sidebar').innerHTML = html;
  autoScroll();
})

document.querySelector('#send-location').addEventListener('click', () => {
  $sendLocationButton.setAttribute('disabled', 'disabled');
  if(!navigator.geolocation){
    return alert('Geolocation is not supported in your browser');
  }

  navigator.geolocation.getCurrentPosition(({coords: {latitude, longitude}}) => {
    socket.emit('sendLocation', {latitude, longitude}, (ack) => {
      $sendLocationButton.removeAttribute('disabled');
      console.log(ack);
    })
  })
})

socket.emit('join', {username, room}, (error) => {
  if(error){
    alert(error);
    location.href = '/';
  }
});