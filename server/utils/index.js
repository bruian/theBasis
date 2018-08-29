'use strict'
import neh 				from 'nodemailer-express-handlebars'
import path       from 'path'
import crypto 		from 'crypto'
import nodemailer from 'nodemailer'
import configPrivate from '../config-private'

const email = configPrivate.email.address || 'auth_email_address@gmail.com'
const passw = configPrivate.email.password || 'auth_email_pass'
const provider = configPrivate.email.provider || 'Gmail'

const smtpTransport = nodemailer.createTransport({
	service: provider,
	auth: {
		user: email,
		pass: passw
	}
})

const handlebarsOptions = {
	viewEngine: 'handlebars',
	viewPath: path.resolve('./server/mailtemplates'),
	extName: '.html'
}

smtpTransport.use('compile', neh(handlebarsOptions))

module.exports.smtpTransport = smtpTransport

/**
 * Return a unique identifier with the given `len`.
 *
 * @param {Number} length
 * @return {String}
 * @api private
*/
module.exports.getUid = (length) => {
  let uid = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charsLength = chars.length

  for (let i = 0; i < length; ++i) {
    uid += chars[getRandomInt(0, charsLength - 1)]
  }

  return uid
}

/**
 * Return result e-mail validation
 * @param {String} value
 * @return {Boolean}
*/
module.exports.validateEmail = (value) => {
	return /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/.test(value)
}

/**
 * Return random token string
 * @return {String}
 */
module.exports.randomToken = () => {
	return crypto.randomBytes(32).toString('hex')
}

/**
 * Return a random int, used by `utils.getUid()`.
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
*/
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Returns various elements when comparing two arrays
 * @param {Array} First array
 * @param {Array} Second array
 * @return {Array} Distinguished Elements
*/
module.exports.differentArray = (firstArr, secondArr) => {
	return firstArr.filter(i => !secondArr.includes(i)).concat(secondArr.filter(i => !firstArr.includes(i)))
}
