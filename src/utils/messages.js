const generateMessage = (text, username) => ({
  text,
  createdAt: new Date().getTime(),
  username,
})

const generateLocationMessage = ({latitude, longitude}, username) => ({
  href: `https://google.com/maps?q=${latitude},${longitude}`,
  createdAt: new Date().getTime(),
  username,
})

module.exports = {
  generateMessage,
  generateLocationMessage,
}