import fetch from 'node-fetch';

class Client {
    private readonly host: string = 'https://myplace-app.com';

    login(email: string, password: string): Promise<string> {
        return fetch(`${this.host}/api/sessions`, {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((v) => v.json())
            .then((v: { access_token: string; refresh_access_token: string }) => v.access_token);
    }
}

const client = new Client();

export default client;
