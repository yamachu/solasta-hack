import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import api from './client';

if (process.env.LOCAL_DEV !== undefined) {
    admin.initializeApp();
}

export const updateToken = functions
    .region('asia-northeast1')
    .pubsub.topic('update')
    .onPublish(async (_) => {
        const config = await admin
            .firestore()
            .doc('/admin/config')
            .get();

        const email = config.get('email');
        const password = config.get('password');
        const token = await api.login(email, password);

        await admin
            .firestore()
            .doc('/admin/token')
            .set({ accessToken: token });
    });
