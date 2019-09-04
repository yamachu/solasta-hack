import { updateToken as updateMyPlaceToken } from './updateMyPlaceToken';
import admin from 'firebase-admin';

admin.initializeApp();

let _myHttpHandler;
let _puppeteerHandler;

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'myHttpHandler') {
    _myHttpHandler = require('./airconController/index')['handler'];
}
if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'puppeteerHandler') {
    _puppeteerHandler = require('./invitationController/index')['handler'];
}

export const updateToken = updateMyPlaceToken;
export const myHttpHandler = _myHttpHandler;
export const puppeteerHandler = _puppeteerHandler;
