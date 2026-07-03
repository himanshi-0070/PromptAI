const User = require('../models/User')
const { generateToken } = require('../utils/jwt')
const CustomError = require('../utils/CustomError')

const registerUser = async (name, email, password) => {
  const userExists = await User.findOne({ email })

  if (userExists) {
    throw new CustomError('User already exists with this email.', 400)
  }

  const user = await User.create({
    name,
    email,
    password,
  })

  if (user) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    }
  } else {
    throw new CustomError('Invalid user data.', 400)
  }
}

const loginUser = async (email, password) => {
  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) {
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    }
  } else {
    throw new CustomError('Invalid email or password.', 401)
  }
}

module.exports = {
  registerUser,
  loginUser,
}
