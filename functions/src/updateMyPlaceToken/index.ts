import admin from 'firebase-admin';
import { pubsub } from 'firebase-functions';
import api from './client';

if (process.env.LOCAL_DEV !== undefined) {
    admin.initializeApp();
}

export const updateToken = pubsub.topic('update').onPublish(async (_) => {
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
