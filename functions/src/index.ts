import { updateToken as updateMyPlaceToken } from './updateMyPlaceToken';
import admin from 'firebase-admin';

admin.initializeApp();

let _myHttpHandler;

if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === 'myHttpHandler') {
    _myHttpHandler = require('./airconController/index')['handler'];
}

export const updateToken = updateMyPlaceToken;
export const myHttpHandler = _myHttpHandler;
